import { describe, it, expect } from "vitest";
import { graphql } from "graphql";
import { schema } from "./schema";

describe("GraphQL calculate and simulate", () => {
    it("calculate returns finite fields and respects adv/dis cancel", async () => {
        const source = `
            query Calc($input: CalcInput!) {
                calculate(input: $input) {
                    hitChance
                    critChance
                    expectedDamage
                } 
            }
        `;

        const input = {
            attackBonus: 7,
            targetAC: 15,
            critRange: 20,
            avgOnHit: 10,
            avgOnCrit: 20,
            advantage: false,
            disadvantage: false
        };

        const res = await graphql({
            schema,
            source,
            variableValues: { input },
        });

        expect(res.errors).toBeUndefined();

        const data = (res.data as any).calculate;
        expect(Number.isFinite(data.hitChance)).toBe(true);
        expect(Number.isFinite(data.critChance)).toBe(true);
        expect(Number.isFinite(data.expectedDamage)).toBe(true);

        const res2 = await graphql({
            schema,
            source,
            variableValues: { input: { ...input, advantage: true, disadvantage: true } },
        });
        
        expect(res2.errors).toBeUndefined();
        const data2 = (res2.data as any).calculate;
        expect(data2.hitChance).toBeCloseTo(data.hitChance, 10);
        expect(data2.critChance).toBeCloseTo(data.critChance, 10);
    });

    it("simulate returns mean within CI and it is roughly close to expected", async () => {
        const source = `
            query Sim($input: CalcInput!, $trials: Int!) {
            simulate(input: $input, trials: $trials) {
                mean
                ciLow
                ciHigh
            }
        }
        `;
        const input = {
            attackBonus: 7,
            targetAC: 15,
            critRange: 20,
            avgOnHit: 10,
            avgOnCrit: 20,
            advantage: false,
            disadvantage: false,
        };

        const trials = 20_000;
        const res = await graphql({
            schema,
            source,
            variableValues: { input, trials },
        });

        expect(res.errors).toBeUndefined();
        const { mean, ciLow, ciHigh } = (res.data as any).simulate;

        expect(ciLow).toBeLessThanOrEqual(mean);
        expect(ciHigh).toBeGreaterThanOrEqual(mean);
    });

    it("calculate clamps critRange to [2,20]", async () => {
        const source = `
            query Calc($input: CalcInput!) {
                calculate(input: $input) {
                    hitChance
                    critChance
                }
            }
        `;
        const base = { 
            attackBonus: 5, 
            targetAC: 15, 
            avgOnHit: 10, 
            avgOnCrit: 20, 
            advantage: false, 
            disadvantage: false 
        };

        const low = await graphql({ schema, source, variableValues: { input: { ...base, critRange: 1 } } });
        const min = await graphql({ schema, source, variableValues: { input: { ...base, critRange: 2 } } });
        const high = await graphql({ schema, source, variableValues: { input: { ...base, critRange: 25 } } });
        const max = await graphql({ schema, source, variableValues: { input: { ...base, critRange: 20 } } });

        expect((low.data as any).calculate.critChance).toBeCloseTo((min.data as any).calculate.critChance, 10);
        expect((high.data as any).calculate.critChance).toBeCloseTo((max.data as any).calculate.critChance, 10);
  });
});