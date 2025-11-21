import type { ClassKit } from "./types";

export const monkKit: ClassKit = {
  id: "monk",
  label: "Monk",
  defaultLevel: 5,
  attacks: [
    {
      id: "monk-martial-arts",
      label: "Monk Martial Arts Attack",
      profile: {
        attackBonus: 7,
        targetAC: 15,
        damage: [
          { expr: [{ count: 1, sides: 8 }], bonus: 4, critDoublesDice: true },
        ],
        tags: ["simple", "finesse", "melee", "bludgeoning", "weapon"],
      },
    },
  ],
  availableEffects: ["shadow-arts-darkness"],
};
