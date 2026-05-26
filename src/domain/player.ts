export type SkillLevel =
  | "no_experience"
  | "beginner"
  | "intermediate"
  | "experienced";

export const STARTING_ELO: Record<SkillLevel, number> = {
  no_experience: 400,
  beginner: 600,
  intermediate: 800,
  experienced: 1000,
};

export interface Player {
  id: string;
  elo: number;
  raceCount: number;
  skillLevel: SkillLevel;
  createdAt: string;
}
