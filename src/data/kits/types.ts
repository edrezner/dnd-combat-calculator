import { AttackProfile } from "@/lib/calc";

export type ClassId = "fighter" | "monk" | "paladin" | "sorcerer" | "warlock";

export interface AttackProfileOption {
  id: string;
  label: string;
  profile: AttackProfile;
}

export interface ClassKit {
  id: ClassId;
  label: string;
  defaultLevel: number;
  attacks: AttackProfileOption[];
  availableEffects: string[];
}
