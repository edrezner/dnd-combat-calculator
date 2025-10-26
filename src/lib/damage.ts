import { DiceExpr, avg } from "./dice";
import { sidesValidate } from "./dice";

export type DamageComponent = {
    expr: DiceExpr;
    bonus?: number;
    critDoublesDice?: boolean;
}

export function assertValidComponents(components: DamageComponent[]): void {
  if (!Array.isArray(components) || components.length === 0) {
    throw new Error("Damage components array must be non-empty.");
  }

  for (const [i, comp] of components.entries()) {
    const hasDice = Array.isArray(comp.expr) && comp.expr.length > 0;
    const hasBonus = comp.bonus !== undefined && Number.isInteger(comp.bonus);

    if (!hasDice && !hasBonus) {
      throw new Error(`Damage component #${i} must have dice (expr) or a flat bonus.`);
    }

    if (hasDice) {
      for (const [j, term] of comp.expr.entries()) {
       
        if (!Number.isInteger(term.count) || term.count < 0) {
          throw new Error(`expr term #${j} of component #${i} has invalid count: ${term.count}`);
        }

        sidesValidate(term.sides);

        if (term.plus !== undefined && !Number.isInteger(term.plus)) {
          throw new Error(`expr term #${j} of component #${i} has invalid plus: ${term.plus}`);
        }
      }
    }

    if (comp.bonus !== undefined && !Number.isInteger(comp.bonus)) {
      throw new Error(`Damage component #${i} has invalid bonus: ${comp.bonus}`);
    }
  }
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