import type { AttackProfile } from "./calc";
// import type { Ability } from "./dnd"

export interface EffectContext {
  level?: number;
  //   abilityScores?: Partial<Record<Ability, number>>;
}

export type EffectTag =
  | "to-hit-bonus" // e.g. Sacred Weapon
  | "to-hit-dice" // e.g. Bless, Bardic Inspiration
  | "damage-bonus" // e.g. Dueling Fighting Style
  | "damage-dice" // e.g. Divine Smite
  | "crit-range" // e.g. Champion Sub-class Feature
  | "advantage" // e.g. Reckless Attack, Shadow Monk attacking within Darkness
  | "reroll" // e.g. Savage Attacker
  | "other";

export interface Effect {
  id: string;
  label: string;
  source?: string;
  tags?: EffectTag[];
  requiresSimulation?: boolean;
  applies?(profile: AttackProfile, ctx: EffectContext): boolean;
  apply(profile: AttackProfile, ctx: EffectContext): AttackProfile;
}

export function applyEffects(
  base: AttackProfile,
  effects: Effect[],
  ctx: EffectContext
): { profile: AttackProfile; requiresSimulation: boolean } {
  let profile = base;
  let requiresSimulation = false;

  for (const effect of effects) {
    if (effect.applies && !effect.applies(profile, ctx)) {
      continue;
    }

    profile = effect.apply(profile, ctx);

    if (effect.requiresSimulation) {
      requiresSimulation = true;
    }
  }

  return { profile, requiresSimulation };
}
