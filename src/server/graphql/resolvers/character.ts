import { characters, nextId as _nextId, CharacterData, AbilityScores } from "@/data/characters";
import { normalizeAbility, abilityMod, computeProfBonus } from "@/lib/dnd";
import { hitChance, critChance, expectedDamage } from "@/lib/calc";
import { simulateDPR } from "@/lib/simulate";

let nextId = _nextId;


function isValidScore(v: unknown, {min=3, max=25} = {}): v is number {
  return Number.isInteger(v) && (v as number) >= min && (v as number) <= max;
}

function checkAbilityScores(scores: Partial<AbilityScores>) : asserts scores is AbilityScores {
  const req: (keyof AbilityScores)[] = ["str","dex","con","int","wis","cha"];
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
    };
}

type CalcInput = {
  attackBonus: number;
  targetAC: number;
  critRange?: number;
  avgOnHit: number;
  avgOnCrit: number;
  advantage?: boolean;
  disadvantage?: boolean;
}

export const characterResolvers = {
  Query: {
    characters: () => characters,
    character: (_: unknown, { id }: { id: string }) => 
      characters.find(c => c.id === id) ?? null,
    calculate: (_: unknown, { input }: { input: CalcInput }) => {
      const { attackBonus, targetAC, critRange = 20, avgOnHit, avgOnCrit, advantage = false, disadvantage = false } = input;
      
      if (attackBonus === undefined) throw new Error(`Attack bonus required to generate DPR`)
      if (targetAC < 1 || targetAC === undefined) throw new Error(`Target's AC must be greater than 0`);
      if (avgOnHit < 0 || avgOnCrit < 0 || avgOnHit === undefined || avgOnCrit === undefined) throw new Error(`Average damage must be non-negative`);

      const hc = hitChance({ attackBonus, targetAC, advantage, disadvantage });
      const cc = critChance({ critRange, advantage, disadvantage });
      const ed = expectedDamage({ hitChance: hc, critChance: cc, avgOnHit, avgOnCrit });
      
      return { hitChance: hc, critChance: cc, expectedDamage: ed };
    },
    simulate: (_: unknown, { input, trials }: { input: CalcInput; trials: number }) => {
      const { attackBonus, targetAC, critRange = 20, avgOnHit, avgOnCrit, advantage = false, disadvantage = false } = input;

      if (!Number.isFinite(attackBonus)) throw new Error("attackBonus is required");
      if (!Number.isFinite(targetAC) || targetAC < 1) throw new Error("targetAC must be ≥ 1");
      if (!Number.isFinite(avgOnHit) || !Number.isFinite(avgOnCrit) || avgOnHit < 0 || avgOnCrit < 0) {
        throw new Error("Average damage must be non-negative numbers");
      };

      if (!Number.isFinite(trials)) throw new Error("trials must be a number");
      if (trials < 1000 || trials > 200_000) throw new Error("trials must be 1,000–200,000");

      const { mean, ciLow, ciHigh } = simulateDPR(trials, { attackBonus, targetAC, critRange, avgOnHit, avgOnCrit, advantage, disadvantage });

      return { mean, ciLow, ciHigh };
    }
  },
    
  Mutation: {
    createCharacter: (_: unknown, { input }: { input: Omit<CharacterData, "id"> }) => {
      const { level, abilityScores } = input;
            
      checkCharacterLevel(level);
      checkAbilityScores(abilityScores);

      const newCharacter = { id: String(nextId++), ...input };
      characters.push(newCharacter);
      return newCharacter;
    }, 
      updateCharacter: (_: unknown, { input } : { input: Partial<CharacterData> & { id: string } }) => {
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
              deletedCharacterId: id
            } 
          }

          return {   
            success: true,
            message: `Character ${id} not found`,
            deletedCharacterId: id   
          }
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
}