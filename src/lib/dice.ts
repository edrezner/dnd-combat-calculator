type Die = 4 | 6 | 8 | 10 | 12 | 20;

export type DiceTerm = {
    count: number;
    sides: Die;
    plus?: number;  
}

type DiceExpr = DiceTerm [];

export function sidesValidate (num: number) {
    let dieArr = [4, 6, 8, 10, 12, 20];

    for (let i = 0; i < dieArr.length; i++) {
        let die = dieArr[i];

        if (die === num) return num;
    }

    throw new Error("Dice must have 4, 6, 8, 10, 12 or 20 sides.");
};

export function avg(expr: DiceExpr): number {
    let total: number = 0;

    if (expr.length === 0) return 0;

    for (let term of expr) {
        const count = term.count;
        const sides = term.sides;
        const plus = term.plus;


        if (count <= 0 || !Number.isInteger(count)) throw new Error("There must be at least one whole number die rolled.");
        sidesValidate(sides);
        if (plus !== undefined && (plus < 0 || !Number.isInteger(plus))) throw new Error("Flat modifiers must be integers.")

        total += count * ((sides + 1) / 2);

        if (plus !== undefined) total += plus;
    }

    return total;
};