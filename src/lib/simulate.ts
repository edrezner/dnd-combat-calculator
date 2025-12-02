import { hitChance, critChance, AttackProfile } from "./calc";
import { avgDamage, assertValidComponents } from "./damage";

export type CalcInput = {
  attackBonus: number;
  targetAC: number;
  critRange?: number;
  avgOnHit: number;
  avgOnCrit: number;
  advantage?: boolean;
  disadvantage?: boolean;
};

type SimResult = {
  mean: number;
  ciLow: number;
  ciHigh: number;
};

export function calcInputFromProfile(profile: AttackProfile): CalcInput {
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

  const avgOnHit = avgDamage(damage, false);
  const avgOnCrit = avgDamage(damage, true);

  return {
    attackBonus,
    targetAC,
    critRange,
    avgOnHit,
    avgOnCrit,
    advantage,
    disadvantage,
  };
}

export function simulateDPR(trials: number, params: CalcInput): SimResult {
  if (trials <= 0) return { mean: 0, ciLow: 0, ciHigh: 0 };

  const {
    attackBonus,
    targetAC,
    critRange = 20,
    avgOnHit,
    avgOnCrit,
    advantage = false,
    disadvantage = false,
  } = params;

  if (
    !Number.isFinite(avgOnHit) ||
    !Number.isFinite(avgOnCrit) ||
    !Number.isFinite(targetAC) ||
    !Number.isFinite(attackBonus) ||
    avgOnHit < 0 ||
    avgOnCrit < 0 ||
    targetAC < 1 ||
    attackBonus < 0
  ) {
    throw new Error(
      "Attack bonus, target's AC, and damage values must be non-negative numbers"
    );
  }

  const pCrit = Math.min(
    Math.max(0, critChance({ critRange, advantage, disadvantage })),
    1
  );
  const pHitNotCrit = Math.max(
    0,
    Math.min(
      1 - pCrit,
      hitChance({ attackBonus, targetAC, advantage, disadvantage }) - pCrit
    )
  );

  let n = 0;
  let mean = 0;
  let sumSqDev = 0;
  let variance = 0;
  let se: number;
  let ciLow: number;
  let ciHigh: number;

  for (let i = 0; i < trials; i++) {
    n++;
    const u = Math.random();
    let damage: number;

    if (u < pCrit) {
      damage = avgOnCrit;
    } else if (u < pCrit + pHitNotCrit) {
      damage = avgOnHit;
    } else {
      damage = 0;
    }

    let delta = damage - mean;
    mean += delta / n;

    let delta2 = damage - mean;
    sumSqDev += delta * delta2;
  }

  if (n < 2) {
    sumSqDev = 0;
  } else {
    variance = sumSqDev / (n - 1);
  }

  variance = Math.max(0, variance);

  se = Math.sqrt(variance / n);

  ciLow = mean - 1.96 * se;
  ciHigh = mean + 1.96 * se;

  return { mean, ciLow, ciHigh };
}
