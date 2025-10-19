# D&D 2024 Combat Calculator

[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Description

The D&D Combat Calculator allows users to enter attributes from their characters and a target Armor Class (AC). It computed the expected damage per round (DPR) using exact probability math and verifies it via a Monte Carlo simulation.

## Math Notes

- **d20 tests**: natural 1 always misses; natural 20 always hits.
- **Advantage/Disadvantage**: roll two d20, keep higher/lower. If both are present, they cancel.
- **Crit range**: integer in `[2, 20]` (default `20`) represents the minimum roll required on a d20 for a crit. Values outside that range are clamped.
- **Expected damage** splits non-crit vs crit:
  - `nonCritChance = Math.max(0, hitChance - critChance)`

### Hit Chance

For the final kept d20 value `roll`, a hit occurs if `roll + attackBonus >= targetAC`, plus nat-20 auto-hit and nat-1 auto-miss. We compute the exact distribution under adv/dis and sum the hit region.

### Crit Chance

Crit occurs when `roll >= critRange` on the final kept die, using the same adv/dis distribution. (`critRange = 20` = crit on 20; `19` = 19–20, etc.)

### Expected Damage

`expectedDamage = nonCritChance * avgOnHit + critChance * avgOnCrit`
Where:

- `avgOnHit` = average damage on a normal hit
- `avgOnCrit` = average damage on a critical hit

### Simulation (Monte Carlo)

We simulate `trials` independent attacks under the same rules and report:

- `mean` and `variance` are calculated utilizing [Welford's Algorithm](https://en.wikipedia.org/wiki/Algorithms_for_calculating_variance#Welford's_online_algorithm).
- `mean` DPR is derived within the algorithm for a range of `trials` by accounting for `pCrit` (probability of landing a crit), `pHitNotCrit` (probability of landing a hit) and a miss (probability of missing including rolling a nat 1) and calculating damage for that instance of `trials` based on one of those three outcomes.
- 95% CI (normal approx): `mean ± 1.96 * (sampleStdDev / sqrt(trials))`

## Scripts

- `npm run dev` - Next dev server
- `npm run test` - Vitest unit + integration tests

## Tech

Next.js • GraphQL Yoga • @graphql-tools/schema • Apollo Client • TypeScript • Vitest • Tailwind
