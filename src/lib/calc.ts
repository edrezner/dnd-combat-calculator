import { avgDamage, DamageComponent, assertValidComponents } from "./damage";

export type AttackProfile = {
  attackBonus: number;
  targetAC: number;
  critRange?: number;
  damage: DamageComponent[];
  advantage?: boolean;
  disadvantage?: boolean;
};

// hitChance returns *overall* hit probability (includes crits with nat 1 auto-miss/default nat 20 auto-hit rules).
// critChance returns crit probability
// nonCritChance clamps hitChance - critChance at 0 and avoids double counting crits.

export function expectedDamageFromProfile(profile: AttackProfile): number {
  const {
    attackBonus,
    targetAC,
    critRange = 20,
    damage,
    advantage = false,
    disadvantage = false,
  } = profile;
  if (!Number.isInteger(attackBonus))
    throw new Error("Attack bonus must be an integer.");
  if (!Number.isInteger(targetAC))
    throw new Error("Target AC must be an integer.");

  assertValidComponents(damage);

  const hc = hitChance({ attackBonus, targetAC, advantage, disadvantage });
  const cc = critChance({ critRange, advantage, disadvantage });

  const nonCritChance = Math.max(0, hc - cc);

  const avgOnHit = avgDamage(damage, false);
  const avgOnCrit = avgDamage(damage, true);

  const expected = avgOnHit * nonCritChance + avgOnCrit * cc;

  return expected;
}

export function hitChance({
  attackBonus,
  targetAC,
  advantage = false,
  disadvantage = false,
}: {
  attackBonus: number;
  targetAC: number;
  advantage?: boolean;
  disadvantage?: boolean;
}): number {
  let hits = 0;

  for (let roll = 1; roll <= 20; roll++) {
    if (roll === 20) {
      hits++;
    } else if (roll === 1) {
      continue;
    } else if (roll + attackBonus >= targetAC) {
      hits++;
    } else {
      continue;
    }
  }

  const p = hits / 20;
  const pAdv = 1 - (1 - p) ** 2;
  const pDisadv = p ** 2;

  if (advantage && disadvantage) {
    return p;
  } else if (advantage) {
    return pAdv;
  } else if (disadvantage) {
    return pDisadv;
  } else {
    return p;
  }
}

export function critChance({
  critRange = 20,
  advantage = false,
  disadvantage = false,
}: {
  critRange?: number;
  advantage?: boolean;
  disadvantage?: boolean;
}): number {
  const cr = Math.min(Math.max(critRange, 2), 20);
  const p = (21 - cr) / 20;
  const pAdv = 1 - (1 - p) ** 2;
  const pDisadv = p ** 2;

  if (advantage && disadvantage) {
    return p;
  } else if (advantage) {
    return pAdv;
  } else if (disadvantage) {
    return pDisadv;
  } else {
    return p;
  }
}

export function expectedDamage({
  hitChance,
  critChance,
  avgOnHit,
  avgOnCrit,
}: {
  hitChance: number;
  critChance: number;
  avgOnHit: number;
  avgOnCrit: number;
}): number {
  const nonCritChance = Math.max(0, hitChance - critChance);
  return nonCritChance * avgOnHit + avgOnCrit * critChance;
}
