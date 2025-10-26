import { describe, it, expect } from "vitest";
import { avgDamage } from "./damage";
import type { DamageComponent } from "./damage";

const componentOne = [{
    expr: [{
            count: 2,
            sides: 6,
        }],
    bonus: 3,
    critDoublesDice: true
}] satisfies DamageComponent[];

const componentTwo = {
    expr: [{
            count: 3,
            sides: 8 as const,
        }],
};

const componentNoDice = [{
    expr: [],
    bonus: 3,
    critDoublesDice: true
}] satisfies DamageComponent[];

describe("avgDamage() - damage averaging and crit tests", () => {
    it("avgDamage: Normal attack with 2d6 + 3 non-crit and crit", () => {
        expect(avgDamage(componentOne, false)).toBe(7 + 3);
        expect(avgDamage(componentOne, true)).toBe(14 + 3);
    });

    it("avgDamage: Handles multiple dice components correctly", () => {
        expect(avgDamage([ ...componentOne, componentTwo ], false)).toBe(7 + 13.5 + 3);
        expect(avgDamage([ ...componentOne, componentTwo ], true)).toBe(14 + 27 + 3);
    });

    it("avgDamage: Skips dice doubling when critsDoubleDice is false", () => {
        expect(avgDamage([{ ...componentOne[0], critDoublesDice: false }, componentTwo], true)).toBe(7 + 27 + 3);
    });

    it("avgDamage: Flat only damage calculated correctly", () => {
        expect(avgDamage( componentNoDice, false )).toBe(3);
        expect(avgDamage( componentNoDice, true )).toBe(3);
    });

    it("avgDamage: Throws error on non-integer bonus", () => {
        expect(() => avgDamage([{ ...componentOne[0], bonus: 2.5 }], false)).toThrow("Damage bonus must be an integer.");
    })
});