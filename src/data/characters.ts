export type AbilityScores = {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
};

export type CharacterData = {
    id: string;
    name: string;
    klass: string;
    level: number;
    abilityScores: AbilityScores;
};

const DEFAULT: AbilityScores = { str:10, dex:10, con:10, int:10, wis:10, cha:10 };
const makeDefault = (): AbilityScores => ({ ...DEFAULT });

export const characters: CharacterData[] = [
  { id: "1", name: "Aeon Solguard", klass: "Paladin", level: 5, abilityScores: makeDefault() }, 
  { id: "2", name: "Nyra Quickstep", klass: "Rogue", level: 5, abilityScores: makeDefault() },
];



export let nextId = 3;

