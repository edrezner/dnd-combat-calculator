import type { ClassKit } from "./types";

export const sorcererKit: ClassKit = {
  id: "sorcerer",
  label: "Sorcerer",
  defaultLevel: 5,
  attacks: [
    {
      id: "firebolt-attack",
      label: "Firebolt Attack",
      profile: {
        attackBonus: 7,
        targetAC: 15,
        damage: [{ expr: [{ count: 2, sides: 10 }], critDoublesDice: true }],
        tags: ["spell-attack", "spell", "fire"],
      },
    },
  ],
  availableEffects: ["innate-sorcery-attack"],
};
