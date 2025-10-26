import { describe, it, expect } from "vitest";
import { hitChance, critChance, expectedDamage, expectedDamageFromProfile } from "./calc";
import type { AttackProfile } from "./calc";

const profileOne = {
    attackBonus: 7,
    targetAC: 15, 
    critRange: 20,
    damage: [{ expr: [{ count: 2, sides: 6 }], bonus: 3, critDoublesDice: true }],
    advantage: false,
    disadvantage: false
} satisfies AttackProfile;

const profileTwo = {
    attackBonus: 7,
    targetAC: 15, 
    critRange: 20,
    damage: [{ expr: [{ count: 2, sides: 6 }, { count: 4, sides: 8 }], bonus: 3, critDoublesDice: true }],
    advantage: false,
    disadvantage: false
} satisfies AttackProfile;

describe ("hitChance basics", () => {
    it("hitChance: +7 vs AC of 15 (normal)", () => {
        const p = hitChance({ attackBonus: 7, targetAC: 15 });
        expect(p).toBeCloseTo(0.65, 5);
    });

    it("hitChance: +7 vs AC of 15 (advantage)", () => {
        const p = hitChance({ attackBonus: 7, targetAC: 15, advantage: true });
        expect(p).toBeCloseTo(0.8775, 5);
    });

    it("hitChance: +7 vs AC of 15 (disadvantage)", () => {
        const p = hitChance({ attackBonus: 7, targetAC: 15, disadvantage: true });
        expect(p).toBeCloseTo(0.4225, 5);
    });

    it("hitChance: Only 20 hits (normal)", () => {
        const p = hitChance({ attackBonus: 0, targetAC: 50 });
        expect(p).toBeCloseTo(0.05, 5);
    });

    it("hitChance: Only 20 hits (advantage)", () => {
        const p = hitChance({ attackBonus: 0, targetAC: 50, advantage: true });
        expect(p).toBeCloseTo(0.0975, 5);
    });

    it("hitChance: Only 20 hits (disadvantage)", () => {
        const p = hitChance({ attackBonus: 0, targetAC: 50, disadvantage: true });
        expect(p).toBeCloseTo(0.0025, 5);
    });

    it("hitChance: Only 1 misses (normal)", () => {
        const p = hitChance({ attackBonus: 50, targetAC: 5 });
        expect(p).toBeCloseTo(0.95, 5);
    });

    it("hitChance: Only 1 misses (advantage)", () => {
        const p = hitChance({ attackBonus: 50, targetAC: 5, advantage: true });
        expect(p).toBeCloseTo(0.9975, 5);
    });

    it("hitChance: Only 1 misses (disadvantage)", () => {
        const p = hitChance({ attackBonus: 50, targetAC: 5, disadvantage: true });
        expect(p).toBeCloseTo(0.9025, 5);
    });
});

describe("hitChance extras", () => {
    it("hitChance: +7 vs AC of 15 (advantage + disadvantage cancel out)", () => {
        const p = hitChance({ attackBonus: 7, targetAC: 15, advantage: true, disadvantage: true });
        expect(p).toBeCloseTo(0.65, 5);
    });

    it("hitChance: Advantage is greater than normal is greater than disadvantage", () => {
        const p = hitChance({ attackBonus: 5, targetAC: 15});
        const pAdv = hitChance({ attackBonus: 5, targetAC: 15, advantage: true});
        const pDisadv = hitChance({ attackBonus: 5, targetAC: 15, disadvantage: true});

        expect(pAdv).toBeGreaterThan(p);
        expect(p).toBeGreaterThan(pDisadv);        
    });

    it("hitChance: Hit chance increases with higher attack bonus", () => {
        const pOne = hitChance({ attackBonus: 6, targetAC: 15 });
        const pTwo = hitChance({ attackBonus: 7, targetAC: 15 });
        const pThree = hitChance({ attackBonus: 8, targetAC: 15 });

        expect(pOne).toBeLessThan(pTwo);
        expect(pTwo).toBeLessThan(pThree);
    });

    it("hitChance: Hit chance decreases with higher AC", () => {
        const pOne = hitChance({ attackBonus: 7, targetAC: 14 });
        const pTwo = hitChance({ attackBonus: 7, targetAC: 15 });
        const pThree = hitChance({ attackBonus: 7, targetAC: 16 });

        expect(pOne).toBeGreaterThan(pTwo);
        expect(pTwo).toBeGreaterThan(pThree);
    });

    it("hitChance: Hit chance is always between 0 and 1", () => {
        for (let i = 0; i < 200; i++) {
            const attackBonusRandom = Math.floor(Math.random() * 26 - 5);
            const targetACRandom = Math.floor(Math.random() * 30 - 5);
            const p = hitChance({ attackBonus: attackBonusRandom, targetAC: targetACRandom});
            expect(p).toBeGreaterThan(0);
            expect(p).toBeLessThan(1);
        }
    })
});

describe("critChance basics", () => {
    it("critChance: Default crit chance is 5% (normal)", () => {
        const p = critChance({});
        expect(p).toBe(0.05);
    });

    it("critChance: Default crit chance is 9.75% (advantage)", () => {
        const p = critChance({ advantage: true });
        expect(p).toBeCloseTo(0.0975);
    });

    it("critChance: Default crit chance is 2.5% (disadvantage)", () => {
        const p = critChance({ disadvantage: true });
        expect(p).toBeCloseTo(0.0025);
    });

    it("critChance: Crit on 19 crit chance is 10%", () => {
        const p = critChance({ critRange: 19 });
        expect(p).toBe(0.1);
    });
});

describe("critChance extras", () => {
    it("critChance: Advantage + disadvantage cancel out", () => {
        const p = critChance({ advantage: true, disadvantage: true });
        expect(p).toBeCloseTo(0.05, 5);
    });

    it("critChance: Crit chance cannot be higher than 95% or lower than 5% (normal)", () => {
        const pHigh = critChance({ critRange: 1});
        const pLow = critChance({ critRange: 25});

        expect(pHigh).toBeCloseTo(0.95, 5);
        expect(pLow).toBeCloseTo(0.05, 5);
    });

    it("critChance: Advantage is greater than normal is greater than disadvantage", () => {
        const p = critChance({});
        const pAdv = critChance({ advantage: true});
        const pDisadv = critChance({ disadvantage: true});

        expect(pAdv).toBeGreaterThan(p);
        expect(p).toBeGreaterThan(pDisadv);        
    });
})

describe("expectedDamage basics", () => {
    it("expectedDamage: Expected dmg is 7 vs 15 AC with +7 to hit and default crit range", () => {
        const dmg = expectedDamage({ hitChance: 0.65, critChance: 0.05, avgOnHit: 10, avgOnCrit: 20 });
        expect(dmg).toBeCloseTo(7, 5);

    });

    it("expectedDamage: Expected damage increases with advantage", () => {
        const dmgAdv = expectedDamage({ hitChance: 0.8775, critChance: 0.05, avgOnHit: 10, avgOnCrit: 20 });
        const dmg = expectedDamage({ hitChance: 0.65, critChance: 0.05, avgOnHit: 10, avgOnCrit: 20 });

        expect(dmgAdv).toBeCloseTo(9.275);
        expect(dmgAdv).toBeGreaterThan(dmg);
    });

    it("expectedDamage: Expected damage decreases with disadvantage", () => {
        const dmgDisadv = expectedDamage({ hitChance: 0.4225, critChance: 0.05, avgOnHit: 10, avgOnCrit: 20 });
        const dmg = expectedDamage({ hitChance: 0.65, critChance: 0.05, avgOnHit: 10, avgOnCrit: 20 });

        expect(dmgDisadv).toBeCloseTo(4.725);
        expect(dmgDisadv).toBeLessThan(dmg);
    });
});

describe("expectedDamage extras", () => {
    it("expectedDamage: Advantage + disadvantage deliver same expected damage as normal", () => {
        const pAdvDisadv = hitChance({ attackBonus: 7, targetAC: 15, advantage: true, disadvantage: true });
        const p = hitChance({ attackBonus: 7, targetAC: 15 });

        const dmgAdvDisadv = expectedDamage({ hitChance: pAdvDisadv, critChance: 0.05, avgOnHit: 10, avgOnCrit: 20 });
        const dmg = expectedDamage({ hitChance: p, critChance: 0.05, avgOnHit: 10, avgOnCrit: 20 });

        expect(dmgAdvDisadv).toBe(dmg);
    });

    it("expectedDamage: When average damage on hit is equal to average damage on crit, expected damage is same as total hit chance * average damage on hit", () => {
        const dmg = expectedDamage({ hitChance: 0.65, critChance: 0.05, avgOnHit: 10, avgOnCrit: 10 });
        const hitChance = 0.65;
        const avgOnHit = 10;

        expect(dmg).toBeCloseTo(hitChance * avgOnHit, 5);
    })
});

describe("expectedDamageFromProfile basics", () => {
    it("expectedDamageFromProfiles: Calculates damage at normal/advantage/disadvantage statuses correctly", () => {
        const normal = expectedDamageFromProfile(profileOne);
        const adv = expectedDamageFromProfile({ ...profileOne, advantage: true });
        const disadv = expectedDamageFromProfile({ ...profileOne, disadvantage: true });

        expect(normal).toBeCloseTo(6.85, 5);
        expect(adv).toBeCloseTo(9.4575, 5);
        expect(disadv).toBeCloseTo(4.2425, 5) ;
    });

    it("expectedDamageFromProfiles: Calculates multiple Damage Components (mixed dice) correctly", () => {
        const twoDSixPlusFourDEightPlusThree = expectedDamageFromProfile(profileTwo);

        expect(twoDSixPlusFourDEightPlusThree).toBeCloseTo(19.45, 5);
    });

    it("expectedDamageFromProfiles: Ensures larger crit chance increases damage and hit chance can never be 100% or 0%", () => {
        const normal = expectedDamageFromProfile(profileOne);
        const critOnNineteen = expectedDamageFromProfile({ ...profileOne, critRange: 19 });
        const onlyCritHits = expectedDamageFromProfile({ ...profileOne, attackBonus: 0, targetAC: 25 });
        const onlyOneMisses = expectedDamageFromProfile({ ...profileOne, attackBonus: 30, targetAC: 10 });

        expect(normal).toBeLessThan(critOnNineteen);
        expect(onlyCritHits).toBeCloseTo(0.85, 5);
        expect(onlyOneMisses).toBeCloseTo(9.85, 5);
    });

    it("expectedDamageFromProfiles: Empty damage component, dice term with invalid sides, and non-integer bonuses throw errors", () => {
        expect(() => expectedDamageFromProfile({ ...profileOne, damage: [{ expr: [] }]})).toThrow("Damage component #0 must have dice (expr) or a flat bonus.");
        expect(() => expectedDamageFromProfile({ ...profileOne, damage: [{expr: [{ count: 2, sides: 6}], bonus: 2.5, critDoublesDice: true }] })).toThrow(`Damage component #${0} has invalid bonus: ${2.5}`);
    });

    it("expectedDamageFromProfiles: expectedDamageFromProfiles() should match expectedDamage() with equivalent hitChance, critChance and damage values", () => {
        const edfp = expectedDamageFromProfile(profileOne);
        const ed = expectedDamage({ hitChance: 0.65, critChance: 0.05, avgOnHit: 10, avgOnCrit: 17 });

        expect(edfp).toBe(ed);
    })
});