import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { puzzles } from "@/db/schema";
import { generatePuzzle, type DifficultyTier } from "./generate";
import { randomUUID } from "crypto";

const PUZZLES_PER_TIER = 50;
const TIERS: DifficultyTier[] = ["easy", "medium", "hard"];

async function seed() {
  const client = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  const db = drizzle(client);

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
    await db.insert(puzzles).values(rows);
    total += rows.length;
  }

  console.log(`\nSeeded ${total} puzzles.`);
  client.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
