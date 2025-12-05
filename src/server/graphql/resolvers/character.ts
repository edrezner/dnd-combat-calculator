import { GraphQLError } from "graphql";
import {
  characters,
  nextId as _nextId,
  CharacterData,
  AbilityScores,
} from "@/data/characters";
import { normalizeAbility, abilityMod, computeProfBonus } from "@/lib/dnd";
import {
  AttackProfile,
  hitChance,
  critChance,
  expectedDamage,
  expectedDamageFromProfile,
} from "@/lib/calc";
import { CalcInput, simulateDPR, calcInputFromProfile } from "@/lib/simulate";
import { sidesValidate } from "@/lib/dice";
import { assertValidComponents } from "@/lib/damage";
import { ALL_KITS } from "@/data/kits";
import * as EFFECTS from "@/data/effects";
import { applyEffects } from "@/lib/effects";

const ALL_KITS_CONST = Object.values(ALL_KITS);
const ALL_EFFECTS = Object.values(EFFECTS);

let nextId = _nextId;

function isValidScore(v: unknown, { min = 3, max = 25 } = {}): v is number {
  return Number.isInteger(v) && (v as number) >= min && (v as number) <= max;
}

function checkAbilityScores(
  scores: Partial<AbilityScores>
): asserts scores is AbilityScores {
  const req: (keyof AbilityScores)[] = [
    "str",
    "dex",
    "con",
    "int",
    "wis",
    "cha",
  ];
  for (const k of req) {
    const v = scores[k];
    if (!isValidScore(v)) {
      throw new Error(`Ability score ${k} must be an integer in range 3 - 25.`);
    }
  }
}

function checkAbilityScorePatch(patch: Partial<AbilityScores>) {
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined && !isValidScore(v)) {
      throw new Error(`Ability score ${k} must be an integer in range 3 - 25.`);
    }
  }
}

function checkCharacterLevel(level: number) {
  if (level > 20 || level < 1) {
    throw new Error("Character level must be between 1 and 20");
  }
}

function mapDiceTermInput(t: { count: number; sides: number; plus?: number }) {
  const { count, sides, plus = 0 } = t;

  if (!Number.isInteger(count) || count < 1) {
    throw new GraphQLError(`DiceTerm.count must be >= 1 (received ${count})`, {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  if (!Number.isInteger(sides) || !sidesValidate(sides)) {
    throw new GraphQLError(
      `DiceTerm.sides must be 4, 6, 8, 10, 12, or 20 (received ${sides})`,
      { extensions: { code: "BAD_USER_INPUT" } }
    );
  }

  if (!Number.isInteger(plus)) {
    throw new GraphQLError(
      `DiceTerm.plus must be an integer (received ${plus})`,
      { extensions: { code: "BAD_USER_INPUT" } }
    );
  }

  return { count, sides, plus };
}

function mapDamageComponentInput(c: {
  expr: Array<{ count: number; sides: number; plus?: number }>;
  bonus?: number | null;
  critDoublesDice?: boolean | null;
}) {
  if (!Array.isArray(c.expr) || c.expr.length === 0) {
    throw new GraphQLError(`DamageComponent.expr must be a non-empty array`, {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const expr = c.expr.map(mapDiceTermInput);
  const bonus = c.bonus ?? 0;

  if (!Number.isInteger(bonus)) {
    throw new GraphQLError(
      `DamageComponent.bonus must be an integer (received ${bonus})`,
      { extensions: { code: "BAD_USER_INPUT" } }
    );
  }

  const critDoublesDice = c.critDoublesDice ?? true;

  return { expr, bonus, critDoublesDice };
}

function mapAttackProfileInput(p: any) {
  ["attackBonus", "targetAC"].forEach((k) => {
    if (!Number.isInteger(p[k])) {
      throw new GraphQLError(`${k} must be an integer`, {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }
  });

  const { attackBonus, targetAC, critRange, advantage, disadvantage } = p;

  if (!Array.isArray(p.damage) || p.damage.length === 0) {
    throw new GraphQLError(`AttackProfile.damage must be a non-empty array`, {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const damage = p.damage.map(mapDamageComponentInput);

  assertValidComponents(damage);

  return { attackBonus, targetAC, critRange, damage, advantage, disadvantage };
}

export const characterResolvers = {
  Query: {
    characters: () => characters,
    character: (_: unknown, { id }: { id: string }) =>
      characters.find((c) => c.id === id) ?? null,
    calculate: (_: unknown, { input }: { input: CalcInput }) => {
      const {
        attackBonus,
        targetAC,
        critRange = 20,
        avgOnHit,
        avgOnCrit,
        advantage = false,
        disadvantage = false,
      } = input;

      if (attackBonus === undefined)
        throw new Error(`Attack bonus required to generate DPR`);
      if (targetAC < 1 || targetAC === undefined)
        throw new Error(`Target's AC must be greater than 0`);
      if (
        avgOnHit < 0 ||
        avgOnCrit < 0 ||
        avgOnHit === undefined ||
        avgOnCrit === undefined
      )
        throw new Error(`Average damage must be non-negative`);

      const hc = hitChance({ attackBonus, targetAC, advantage, disadvantage });
      const cc = critChance({ critRange, advantage, disadvantage });
      const ed = expectedDamage({
        hitChance: hc,
        critChance: cc,
        avgOnHit,
        avgOnCrit,
      });

      return { hitChance: hc, critChance: cc, expectedDamage: ed };
    },
    simulate: (
      _: unknown,
      { input, trials }: { input: CalcInput; trials: number }
    ) => {
      const {
        attackBonus,
        targetAC,
        critRange = 20,
        avgOnHit,
        avgOnCrit,
        advantage = false,
        disadvantage = false,
      } = input;

      if (!Number.isFinite(attackBonus))
        throw new Error("attackBonus is required");
      if (!Number.isFinite(targetAC) || targetAC < 1)
        throw new Error("targetAC must be >= 1");
      if (
        !Number.isFinite(avgOnHit) ||
        !Number.isFinite(avgOnCrit) ||
        avgOnHit < 0 ||
        avgOnCrit < 0
      ) {
        throw new Error("Average damage must be non-negative numbers");
      }

      if (!Number.isFinite(trials)) throw new Error("trials must be a number");

      const t = Math.max(1000, Math.min(200_000, Math.floor(trials)));

      const { mean, ciLow, ciHigh } = simulateDPR(t, {
        attackBonus,
        targetAC,
        critRange,
        avgOnHit,
        avgOnCrit,
        advantage,
        disadvantage,
      });

      return { mean, ciLow, ciHigh };
    },
    calculateProfile: (_: unknown, { profile }: any) => {
      const mapped = mapAttackProfileInput(profile);

      const hc = hitChance(mapped);
      const cc = critChance(mapped);
      const expectedDamage = expectedDamageFromProfile(mapped);

      return { hitChance: hc, critChance: cc, expectedDamage };
    },
    kits: () => {
      return ALL_KITS_CONST;
    },
    effects: () => {
      return ALL_EFFECTS.map((effect) => ({
        id: effect.id,
        label: effect.label,
        tags: effect.tags,
        requiresSimulation: effect.requiresSimulation ?? false,
      }));
    },
    buildFromKit: (_: unknown, { input }: any) => {
      const { kitId, level, effectIds, targetAC } = input;
      console.log("buildFromKit input:", input, "kitId typeof:", typeof kitId);

      checkCharacterLevel(level);

      if (!Number.isInteger(targetAC) || targetAC < 1) {
        throw new GraphQLError(
          "Target's AC must be an integer greater than 0.",
          {
            extensions: { code: "BAD_USER_INPUT" },
          }
        );
      }

      if (!Array.isArray(effectIds)) {
        throw new GraphQLError("effectIds must be an array.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      if (kitId.trim() === "" || typeof kitId !== "string") {
        throw new GraphQLError("kitId must be a non-empty string.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const kit = ALL_KITS_CONST.find((k) => k.id === kitId);
      if (!kit)
        throw new GraphQLError("Class kit not found", {
          extensions: { code: "BAD_USER_INPUT" },
        });

      // Only including first attack for now
      const baseFromKit = kit.attacks[0].profile;

      const base = {
        ...baseFromKit,
        targetAC,
        advantage: baseFromKit.advantage ?? false,
        disadvantage: baseFromKit.disadvantage ?? false,
      };

      const effects = ALL_EFFECTS.filter((effect) =>
        effectIds.includes(effect.id)
      );

      // EffectContext type needs an object, not just a number
      const ctx = { level };

      const { profile: finalProfile /* requiresSimulation */ } = applyEffects(
        base,
        effects,
        ctx
      );

      const hc = hitChance(finalProfile);
      const cc = critChance(finalProfile);
      const ed = expectedDamageFromProfile(finalProfile);

      return {
        result: {
          hitChance: hc,
          critChance: cc,
          expectedDamage: ed,
        },
        profile: finalProfile,
      };
    },
    simulateProfile: (
      _: unknown,
      { profile, trials }: { profile: AttackProfile; trials: number }
    ) => {
      const simProfile = calcInputFromProfile(profile);

      if (!Number.isFinite(trials)) throw new Error("trials must be a number");

      const t = Math.max(1000, Math.min(200_000, Math.floor(trials)));

      const { mean, ciLow, ciHigh } = simulateDPR(t, simProfile);

      return { mean, ciLow, ciHigh };
    },
  },

  Mutation: {
    createCharacter: (
      _: unknown,
      { input }: { input: Omit<CharacterData, "id"> }
    ) => {
      const { level, abilityScores } = input;

      checkCharacterLevel(level);
      checkAbilityScores(abilityScores);

      const newCharacter = { id: String(nextId++), ...input };
      characters.push(newCharacter);
      return newCharacter;
    },
    updateCharacter: (
      _: unknown,
      { input }: { input: Partial<CharacterData> & { id: string } }
    ) => {
      const { id, name, klass, level, abilityScores: patch } = input;

      const character = characters.find((c) => c.id === id);

      if (!character) throw new Error(`Character not found: ${id}`);

      if (typeof name === "string") character.name = name;
      if (typeof klass === "string") character.klass = klass;
      if (typeof level === "number") {
        checkCharacterLevel(level);
        character.level = level;
      }
      if (patch) {
        checkAbilityScorePatch(patch);
        character.abilityScores = { ...character.abilityScores, ...patch };
      }

      return character;
    },
    deleteCharacter: (_: unknown, { id }: { id: string }) => {
      const index = characters.findIndex((c) => c.id === id);

      if (index !== -1) {
        characters.splice(index, 1);
        return {
          success: true,
          message: `Character ${id} deleted successfully`,
          deletedCharacterId: id,
        };
      }

      return {
        success: true,
        message: `Character ${id} not found`,
        deletedCharacterId: id,
      };
    },
  },

  Character: {
    profBonus: (character: CharacterData) => computeProfBonus(character.level),

    mod: (character: CharacterData, { ability }: { ability: string }) => {
      const key = normalizeAbility(ability);
      const score = character.abilityScores[key];
      return abilityMod(score);
    },

    toHit: (
      character: CharacterData,
      { using, proficient = true }: { using: string; proficient?: boolean }
    ) => {
      const key = normalizeAbility(using);
      const mod = abilityMod(character.abilityScores[key]);
      const pb = proficient ? computeProfBonus(character.level) : 0;
      return mod + pb;
    },
  },
};
