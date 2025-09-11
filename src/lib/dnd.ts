export const ABILITIES = new Set (["str", "dex", "con", "int", "wis", "cha"]);

export function normalizeAbility(s: string) {
    const key = s.trim().toLowerCase();
    if (!ABILITIES.has(key)) {
        throw new Error(`Invalid ability "${s}". Use one of, str, dex, con, int, wis, cha.`);
    }
    return key as "str"|"dex"|"con"|"int"|"wis"|"cha";
};

export function abilityMod(score: number) {
    return Math.floor((score - 10) / 2);
};

export function computeProfBonus(level: number) {
    if (level >= 17) return 6;
    if (level >= 13) return 5;
    if (level >= 9) return 4;
    if (level >= 5) return 3;
    return 2;
};

