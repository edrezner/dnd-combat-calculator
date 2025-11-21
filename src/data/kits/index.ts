import type { ClassKit } from "./types";
import { fighterKit } from "./fighter";
import { monkKit } from "./monk";
import { paladinKit } from "./paladin";
import { sorcererKit } from "./sorcerer";
import { warlockKit } from "./warlock";

export const ALL_KITS: ClassKit[] = [
  fighterKit,
  monkKit,
  paladinKit,
  sorcererKit,
  warlockKit,
];
