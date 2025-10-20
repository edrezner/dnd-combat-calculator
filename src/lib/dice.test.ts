import { describe, it, expect } from "vitest";
import { avg, sidesValidate, DiceTerm } from "./dice";

const diceExpr: DiceTerm = {
        count: 1,
        sides: 6,
        plus: 3
    };



describe("avg basics", () => {
    it("avg: Empty dice expression returns 0", () => {
        const avgZero = avg([]);

        expect(avgZero).toEqual(0);
    });

    it("avg: Math is calculated correctly with any number dice rolled with or without flat modifier", () => {
        const oneDSix = avg([{ count: 1, sides: 6 }]);
        const twoDSix = avg([{ count: 2, sides: 6 }]);
        const twoDSixPlusThree = avg([{ count: 2, sides: 6, plus: 3 }]);
        const dEightPlusDFourPlusTwo = avg([{ count: 1, sides: 8 }, { count: 1, sides: 4, plus: 2 }]);

        expect(oneDSix).toEqual(3.5);
        expect(twoDSix).toEqual(7);
        expect(twoDSixPlusThree).toEqual(10);
        expect(dEightPlusDFourPlusTwo).toEqual(9);
    });

    it("avg: Throws when count <= 0", () => {
        expect(() => avg([{ ...diceExpr, count: 0 }])).toThrow("There must be at least one whole number die rolled.");
        expect(() => avg([{ ...diceExpr, count: -1 }])).toThrow("There must be at least one whole number die rolled.");
    });

    it("avg: Throws when count is not an integer", () => {
        expect(() => avg([{ ...diceExpr, count: 1.5 }])).toThrow("There must be at least one whole number die rolled.");
    });

    it("avg: Throws on invalid sides", () => {
        expect(() => sidesValidate(7)).toThrow("Dice must have 4, 6, 8, 10, 12 or 20 sides.");
    });

    it("avg: Throws when plus is not an integer or negative", () => {
        expect(() => avg([{ ...diceExpr, plus: -1 }])).toThrow("Flat modifiers must be integers.");
        expect(() => avg([{ ...diceExpr, plus: 1.2 }])).toThrow("Flat modifiers must be integers.");
    });
});