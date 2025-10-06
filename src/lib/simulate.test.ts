import { describe, it, expect } from "vitest";
import { simulateDPR } from "./simulate";
import { hitChance, critChance, expectedDamage } from "./calc";    

const trials = 20_000;
const simInput = {
    attackBonus: 7,
    targetAC: 15,
    critRange: 20, 
    avgOnHit: 50,
    avgOnCrit: 100,
    advantage: false,
    disadvantage: false
}

describe ("simulateDPR basics", () => {
    it("simulateDPR: mean damage falls within 5% of expectedDmg", () => {
        const hc = hitChance({attackBonus: 7, targetAC: 15 })
        const cc = critChance({})
        const expectDmg = expectedDamage({ hitChance: hc, 
        critChance: cc, avgOnHit: 50, avgOnCrit: 100 });
        const { mean } = simulateDPR(trials, simInput);

        expect(Math.abs(mean - expectDmg)).toBeLessThanOrEqual(expectDmg * 0.05);
    });

    it("simulateDPR: low confidence interval is less than mean is less than high confidence interval", () => {
        const { mean, ciLow, ciHigh } = simulateDPR(trials, simInput);
        
        expect(ciLow).toBeLessThan(mean);
        expect(mean).toBeLessThan(ciHigh);
    });

    it("simulateDPR: mean damage increases with attack bonus", () => {
        const { mean: meanOne } = simulateDPR(trials, simInput);
        
        const {mean: meanTwo } = simulateDPR(trials, { ...simInput, attackBonus: 8 });

        expect(meanTwo).toBeGreaterThan(meanOne);
    });

    it("simulateDPR: advantage increases mean damage and disadvantage decreases mean damage", () => {
        const { mean: meanNormal } = simulateDPR(trials, simInput);

        const { mean: meanAdv } = simulateDPR(trials, { ...simInput, advantage: true });

        const { mean: meanDisadv } = simulateDPR(trials, { ...simInput, disadvantage: true });

        expect(meanAdv).toBeGreaterThan(meanNormal);
        expect(meanDisadv).toBeLessThan(meanNormal);
    });

    it("simulateDPR: lower value needed to crit increases mean damage", () => {
        const { mean: meanOne } = simulateDPR(trials, simInput);

        const { mean: meanTwo } = simulateDPR(trials, { ...simInput, critRange: 15 });

        expect(meanTwo).toBeGreaterThan(meanOne);
    })
});