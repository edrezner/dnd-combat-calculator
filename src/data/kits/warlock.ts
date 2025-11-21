import type { ClassKit } from "./types";

export const warlockKit: ClassKit = {
  id: "warlock",
  label: "Warlock",
  defaultLevel: 5,
  attacks: [
    {
      id: "eldritch-blast-attack",
      label: "Eldritch Blast Attack",
      profile: {
        attackBonus: 7,
        targetAC: 15,
        damage: [{ expr: [{ count: 2, sides: 10 }], critDoublesDice: true }],
        tags: ["spell-attack", "spell", "force"],
      },
    },
  ],
  availableEffects: ["hex", "agonizing-blast"],
};
