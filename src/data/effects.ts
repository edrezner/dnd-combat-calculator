import { Effect } from "@/lib/effects";

function rageBonus(level: number | undefined): number {
  if (!level) return 2;
  if (level >= 16) return 4;
  if (level >= 9) return 3;
  return 2;
}

export const archery: Effect = {
  id: "archery",
  label: "Archery Fighting Style",
  tags: ["to-hit-bonus"],
  applies(profile, _ctx) {
    return profile.tags?.includes("ranged") ?? false;
  },
  apply(profile, _ctx) {
    return { ...profile, attackBonus: profile.attackBonus + 2 };
  },
};

export const rage: Effect = {
  id: "rage",
  label: "Rage",
  tags: ["damage-bonus"],
  apply(profile, ctx) {
    const bonus = rageBonus(ctx.level);
    return {
      ...profile,
      damage: [
        ...profile.damage,
        {
          expr: [],
          bonus,
          critDoublesDice: false,
        },
      ],
    };
  },
};

export const hex: Effect = {
  id: "hex",
  label: "Hex",
  tags: ["damage-dice"],
  applies(profile, _ctx) {
    return profile.tags?.includes("spell") ?? false;
  },
  apply(profile, _ctx) {
    return {
      ...profile,
      damage: [
        ...profile.damage,
        {
          expr: [{ count: 1, sides: 6 }],
          critDoublesDice: true,
        },
      ],
    };
  },
};

export const huntersMark: Effect = {
  id: "hunters-mark",
  label: "Hunter's Mark",
  tags: ["damage-dice"],
  applies(profile, _ctx) {
    return profile.tags?.includes("spell") ?? false;
  },
  apply(profile, _ctx) {
    return {
      ...profile,
      damage: [
        ...profile.damage,
        {
          expr: [{ count: 1, sides: 6 }],
          critDoublesDice: true,
        },
      ],
    };
  },
};

export const shadowArtsDarkness: Effect = {
  id: "shadow-arts-darkness",
  label: "Shadow Arts Darkness",
  tags: ["advantage"],
  apply(profile, _ctx) {
    return {
      ...profile,
      advantage: true,
    };
  },
};
