import { describe, it, expect } from "vitest";
import { graphql } from "graphql";
import { schema } from "./schema";

 const sourceCalculate = `
            query Calc($input: CalcInput!) {
                calculate(input: $input) {
                    hitChance
                    critChance
                    expectedDamage
                } 
            }
        `;

        const sourceCalculateProf = `
            query CalcProf($input: AttackProfileInput!) {
                calculateProfile(profile: $input) {
                    hitChance
                    critChance
                    expectedDamage
                }
            }
        `;

        const CalcInput = {
            input: {
                attackBonus: 7,
                targetAC: 15,
                critRange: 20,
                avgOnHit: 10,
                avgOnCrit: 17,
                advantage: false,
                disadvantage: false,
            }
        };

        const AttackProfileInput = {
            input: {
                attackBonus: 7,
                targetAC: 15,
                critRange: 20,
                damage: [
                    {
                        expr: [{ count: 2, sides: 6 }],
                        bonus: 3,
                        critDoublesDice: true
                    }
                ],
                advantage: false,
                disadvantage: false
            }
        };

describe("GraphQL calculate and calculateProfile", () => {
    it("calculate returns finite fields and critChance is close to 5% with default critRange", async () => {
        const res = await graphql({
            schema,
            source: sourceCalculate,
            variableValues: CalcInput,
        });

        expect(res.errors).toBeUndefined();

        const data = (res.data as any).calculate;
        expect(Number.isFinite(data.hitChance)).toBe(true);
        expect(Number.isFinite(data.critChance)).toBe(true);
        expect(Number.isFinite(data.expectedDamage)).toBe(true);
        expect(data.critChance).toBeCloseTo(0.05, 5);
    });

    it("calculate calculates adv/disadv correctly and handles cancel rule when both are true", async () => {
        const CalcInput = {
            attackBonus: 7,
            targetAC: 15,
            critRange: 20,
            avgOnHit: 10,
            avgOnCrit: 17,
            advantage: false,
            disadvantage: false,
        };

        const normal = await graphql({
            source: sourceCalculate,
            schema,
            variableValues: { input: CalcInput }
        });

        const adv = await graphql({
            source: sourceCalculate,
            schema,
            variableValues: { input: {...CalcInput, advantage: true } }
        });

        const cancel = await graphql({
            source: sourceCalculate, 
            schema,
            variableValues: { input: { ...CalcInput, advantage: true, disadvantage: true } }
        });

        const normData = (normal.data as any).calculate;
        const advData = (adv.data as any).calculate;
        const cancelData = (cancel.data as any).calculate;

        expect(advData.critChance).toBeGreaterThan(normData.critChance);
        expect(normData.critChance).toBe(cancelData.critChance);
    });

    it("calculate hitChance increases as attackBonus increases", async () => {
        const CalcInput = {
            attackBonus: 4, 
            targetAC: 15,
            critRange: 20,
            avgOnHit: 10,
            avgOnCrit: 17,
            advantage: false,
            disadvantage: false,
        };

        const low = await graphql({
            schema,
            source: sourceCalculate,
            variableValues: { input: CalcInput }
        });

        const high = await graphql({
            schema,
            source: sourceCalculate,
            variableValues: { input: { ...CalcInput, attackBonus: 8 } }
        });

        const lowData = (low.data as any).calculate;
        const highData = (high.data as any).calculate;

        expect(highData.hitChance).toBeGreaterThan(lowData.hitChance);
    });

    it("calculate and calculateProfile return equivalent results when given mathematically equivalent input", async () => {
        const calc = await graphql({
            schema,
            source: sourceCalculate,
            variableValues: CalcInput
        });

        const calcProf = await graphql({
            schema,
            source: sourceCalculateProf,
            variableValues: AttackProfileInput
        });

        const calcData = (calc.data as any).calculate;
        const calcProfData = (calcProf.data as any).calculateProfile;

        expect(calcData.expectedDamage).toBeCloseTo(calcProfData.expectedDamage, 5);
    });

    it("calculateProfile should return error when a dice with invalid sides is input", async () => {
        const AttackProfileInput = {
            input: {
                attackBonus: 7,
                targetAC: 15,
                critRange: 20,
                damage: [
                    {
                        expr: [{ count: 2, sides: 7 }],
                        bonus: 3,
                        critDoublesDice: true
                    }
                ],
                advantage: false,
                disadvantage: false
            }
        };

        const res = await graphql({
            schema,
            source: sourceCalculateProf,
            variableValues: AttackProfileInput
        });

        expect(res.data).toBeNull();
        expect(res.errors?.length).toBeGreaterThan(0);
        expect(res.errors?.[0].message).toMatch(/sides/i);
    });
    
    it("calculateProfile lowers expectedDamage when critDoublesDice is false", async () => {
        const nonDoubleCritInput = {
            attackBonus: 7,
                targetAC: 15,
                critRange: 20,
                damage: [
                    {
                        expr: [{ count: 2, sides: 6 }],
                        bonus: 3,
                        critDoublesDice: false
                    }
                ],
                advantage: false,
                disadvantage: false
        };

        const critDouble = await graphql({
            schema,
            source: sourceCalculateProf,
            variableValues: AttackProfileInput
        });

        const nonCritDouble = await graphql({
            schema,
            source: sourceCalculateProf,
            variableValues: { input: nonDoubleCritInput }
        });

        const critDoubleData = (critDouble.data as any).calculateProfile;
        const nonCritDoubleData = (nonCritDouble.data as any).calculateProfile;

        expect(critDoubleData.expectedDamage).toBeGreaterThan(nonCritDoubleData.expectedDamage);
    });
});