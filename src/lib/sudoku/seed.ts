import "dotenv/config";
import { controlDb } from "@/db/client";
import { DrizzlePuzzleRepository } from "@/repositories/drizzle/puzzle.repository";
import { generatePuzzle } from "./generate";
import type { DifficultyTier } from "@/domain/puzzle";
import { randomUUID } from "crypto";

const PUZZLES_PER_TIER = 50;

// Clue counts biased toward each tier's expected difficulty range
const TIER_CLUE_HINTS: Record<DifficultyTier, number> = {
  easy: 40,
  medium: 32,
  hard: 26,
  expert: 22,
};

async function seed() {
  const repo = new DrizzlePuzzleRepository(controlDb);

  const tiers: DifficultyTier[] = ["easy", "medium", "hard", "expert"];
  const buckets: Record<DifficultyTier, typeof rows> = {
    easy: [],
    medium: [],
    hard: [],
    expert: [],
  };
  const rows: {
    id: string;
    grid: string;
    solution: string;
    difficultyTier: DifficultyTier;
    puzzleScore: number;
  }[] = [];

  for (const tier of tiers) {
    console.log(`Generating puzzles targeting ${tier}...`);
    let attempts = 0;
    while (buckets[tier].length < PUZZLES_PER_TIER) {
      const { grid, solution, tier: actualTier, score } = generatePuzzle(TIER_CLUE_HINTS[tier]);
      if (actualTier === tier) {
        buckets[tier].push({
          id: randomUUID(),
          grid,
          solution,
          difficultyTier: actualTier,
          puzzleScore: score,
        });
        process.stdout.write(
          `\r  ${buckets[tier].length}/${PUZZLES_PER_TIER} (${attempts + 1} attempts)`,
        );
      }
      attempts++;
    }
    console.log();
    await repo.insert(buckets[tier]);
  }

  const total = tiers.reduce((sum, t) => sum + buckets[t].length, 0);
  console.log(`\nSeeded ${total} puzzles.`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
