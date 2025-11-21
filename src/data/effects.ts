import { Effect } from "@/lib/effects";
import { computeProfBonus } from "@/lib/dnd";

function rageBonus(level: number): number {
  if (level >= 16) return 4;
  if (level >= 9) return 3;
  return 2;
}

function championCritRange(level: number): number {
  if (level >= 15) return 18;
  if (level >= 3) return 19;
  return 20;
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

export const dueling: Effect = {
  id: "dueling",
  label: "Dueling Fighting Style",
  tags: ["damage-bonus"],
  applies(profile, _ctx) {
    const tags = profile.tags ?? [];

    return (
      tags.includes("melee") &&
      tags.includes("weapon") &&
      !tags.includes("heavy") &&
      !tags.includes("ranged") &&
      !tags.includes("two-handed")
    );
  },
  apply(profile, _ctx) {
    const bonus = 2;

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

export const rage: Effect = {
  id: "rage",
  label: "Rage",
  tags: ["damage-bonus"],
  apply(profile, ctx) {
    if (ctx.level == null) return profile;

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

export const innateSorceryAttack: Effect = {
  id: "innate-sorcery-attack",
  label: "Innate Sorcery (Spell Attack)",
  tags: ["advantage"],
  applies(profile, _ctx) {
    return profile.tags?.includes("spell-attack") ?? false;
  },
  apply(profile, _ctx) {
    return {
      ...profile,
      advantage: true,
    };
  },
};

export const championCrit: Effect = {
  id: "champion-crit",
  label: "Improved Critical",
  tags: ["crit-range"],
  apply(profile, ctx) {
    if (ctx.level == null) return profile;

    const critRange = championCritRange(ctx.level);

    return {
      ...profile,
      critRange,
    };
  },
};

export const gwm: Effect = {
  id: "gwm",
  label: "Great Weapon Master",
  tags: ["damage-bonus"],
  applies(profile, _ctx) {
    return profile.tags?.includes("heavy") ?? false;
  },
  apply(profile, ctx) {
    if (ctx.level == null) return profile;

    const bonus = computeProfBonus(ctx.level);

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

export const bless: Effect = {
  id: "bless",
  label: "Bless",
  tags: ["to-hit-dice"],
  requiresSimulation: true,
  apply(profile, _ctx) {
    return profile;
  },
};

export const agonizingBlast: Effect = {
  id: "agonizing-blast",
  label: "Agonizing Blast",
  tags: ["damage-bonus"],
  applies(profile, _ctx) {
    const tags = profile.tags ?? [];
    return tags.includes("spell-attack");
  },
  apply(profile, ctx) {
    if (ctx.level == null) return profile;
    const attackBonus = profile.attackBonus;
    const profBonus = computeProfBonus(ctx.level);
    const attrBonus = Math.abs(attackBonus - profBonus);
    // note: assumes count = number of beams (e.g. EB 2 beams at level 5 = 2d10)
    const multiplier = profile.damage[0].expr[0].count;
    const bonus = attrBonus * multiplier;

    return {
      ...profile,
      damage: [...profile.damage, { expr: [], bonus, critDoublesDice: false }],
    };
  },
};
