import type { ClassKit } from "./types";

export const paladinKit: ClassKit = {
  id: "paladin",
  label: "Paladin",
  defaultLevel: 5,
  attacks: [
    {
      id: "longsword-attack",
      label: "Paladin Longsword Attack",
      profile: {
        attackBonus: 7,
        targetAC: 15,
        damage: [
          { expr: [{ count: 1, sides: 8 }], bonus: 4, critDoublesDice: true },
        ],
        tags: ["weapon", "martial", "slashing", "melee", "versatile"],
      },
    },
  ],
  availableEffects: ["dueling"],
};
