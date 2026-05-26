export type DifficultyTier = "easy" | "medium" | "hard";

export interface Puzzle {
  id: string;
  grid: string;
  solution: string;
  difficultyTier: DifficultyTier;
  createdAt: string;
}
