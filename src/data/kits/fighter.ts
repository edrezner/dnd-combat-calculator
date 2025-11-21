import type { ClassKit } from "./types";

export const fighterKit: ClassKit = {
  id: "fighter",
  label: "Fighter",
  defaultLevel: 5,
  attacks: [
    {
      id: "fighter-greatsword",
      label: "Greatsword Attack",
      profile: {
        attackBonus: 7,
        targetAC: 15,
        damage: [
          { expr: [{ count: 2, sides: 6 }], bonus: 4, critDoublesDice: true },
        ],
        tags: ["heavy", "two-handed", "melee", "martial", "slashing", "weapon"],
      },
    },

    {
      id: "fighter-longbow",
      label: "Longbow Attack",
      profile: {
        attackBonus: 6,
        targetAC: 15,
        damage: [
          { expr: [{ count: 1, sides: 8 }], bonus: 3, critDoublesDice: true },
        ],
        tags: [
          "heavy",
          "two-handed",
          "ranged",
          "martial",
          "piercing",
          "weapon",
        ],
      },
    },
  ],
  availableEffects: ["gwm", "champion-crit", "archery"],
};
