import { DiceExpr, avg } from "./dice";

export type DamageComponent = {
    expr: DiceExpr;
    bonus?: number;
    critDoublesDice?: boolean;
}

export function avgDamage(components: DamageComponent[], isCrit: boolean): number {
    if (!components || components.length === 0) return 0;

    let total = 0;

    for (const { expr, bonus, critDoublesDice = true } of components) {
        if (bonus !== undefined && !Number.isInteger(bonus)) throw new Error("Damage bonus must be an integer.");

        const diceAvg = avg(expr);
        const diceTotals = critDoublesDice && isCrit ? diceAvg * 2 : diceAvg;
        const mods = bonus ?? 0;

        total += diceTotals + mods;
    } 

    return total;

};