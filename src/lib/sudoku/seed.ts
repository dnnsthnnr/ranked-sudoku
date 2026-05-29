import "dotenv/config";
import { controlDb } from "@/db/client";
import { DrizzlePuzzleRepository } from "@/repositories/drizzle/puzzle.repository";
import { generatePuzzle } from "./generate";
import type { DifficultyTier } from "@/domain/puzzle";
import { randomUUID } from "crypto";

const PUZZLES_PER_TIER = 50;
const TIERS: DifficultyTier[] = ["easy", "medium", "hard"];

async function seed() {
  const repo = new DrizzlePuzzleRepository(controlDb);

  let total = 0;
  for (const tier of TIERS) {
    console.log(`Generating ${PUZZLES_PER_TIER} ${tier} puzzles...`);
    const rows = [];
    for (let i = 0; i < PUZZLES_PER_TIER; i++) {
      const { grid, solution } = generatePuzzle(tier);
      rows.push({ id: randomUUID(), grid, solution, difficultyTier: tier });
      process.stdout.write(`\r  ${i + 1}/${PUZZLES_PER_TIER}`);
    }
    console.log();
    await repo.insert(rows);
    total += rows.length;
  }

  console.log(`\nSeeded ${total} puzzles.`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
