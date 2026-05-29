#!/usr/bin/env tsx
/**
 * Batch puzzle generation script.
 *
 * Fills the puzzle pool for each difficulty tier using technique-based scoring.
 * Biases clue removal toward each tier's typical range to improve yield.
 *
 * Usage:
 *   npx tsx scripts/generate-puzzles.ts [--target <n>] [--tier easy|medium|hard|expert]
 *
 * Before first run against a fresh database, clear existing puzzles:
 *   DELETE FROM puzzles;
 *
 * Requires CONTROL_DATABASE_URL (and optionally CONTROL_DATABASE_AUTH_TOKEN) in env.
 */

import "dotenv/config";
import { randomUUID } from "crypto";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq, count } from "drizzle-orm";
import * as controlSchema from "../src/db/schema/control";
import { puzzles } from "../src/db/schema/control";
import { generatePuzzle } from "../src/lib/sudoku/generate";
import type { DifficultyTier } from "../src/domain/puzzle";

const TIER_CLUE_HINTS: Record<DifficultyTier, number> = {
  easy: 40,
  medium: 32,
  hard: 26,
  expert: 22,
};

const ALL_TIERS: DifficultyTier[] = ["easy", "medium", "hard", "expert"];

function parseArgs(): { target: number; tiers: DifficultyTier[] } {
  const args = process.argv.slice(2);
  let target = 100;
  let tiers: DifficultyTier[] = ALL_TIERS;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--target" && args[i + 1]) {
      target = parseInt(args[++i], 10);
    } else if (args[i] === "--tier" && args[i + 1]) {
      const t = args[++i] as DifficultyTier;
      if (!ALL_TIERS.includes(t)) {
        console.error(`Unknown tier: ${t}. Must be one of: ${ALL_TIERS.join(", ")}`);
        process.exit(1);
      }
      tiers = [t];
    }
  }

  return { target, tiers };
}

function printProgress(counts: Record<DifficultyTier, number>, target: number, tiers: DifficultyTier[]): void {
  const parts = tiers.map((t) => `[${t}: ${counts[t]}/${target}]`);
  process.stdout.write(`\r${parts.join(" ")}  `);
}

async function main(): Promise<void> {
  const { target, tiers } = parseArgs();

  const db = drizzle(
    createClient({
      url: process.env.CONTROL_DATABASE_URL!,
      authToken: process.env.CONTROL_DATABASE_AUTH_TOKEN,
    }),
    { schema: controlSchema },
  );

  // Count existing puzzles per requested tier
  const currentCounts: Record<DifficultyTier, number> = { easy: 0, medium: 0, hard: 0, expert: 0 };
  for (const tier of tiers) {
    const rows = await db
      .select({ n: count() })
      .from(puzzles)
      .where(eq(puzzles.difficultyTier, tier));
    currentCounts[tier] = rows[0]?.n ?? 0;
  }

  console.log(`Target: ${target} per tier`);
  for (const tier of tiers) {
    console.log(`  ${tier}: ${currentCounts[tier]} existing`);
  }
  console.log();

  const pending = tiers.filter((t) => currentCounts[t] < target);
  if (pending.length === 0) {
    console.log("All tiers already at target. Nothing to do.");
    return;
  }

  let attempts = 0;
  printProgress(currentCounts, target, tiers);

  while (pending.some((t) => currentCounts[t] < target)) {
    // Pick the tier most in need
    const tier = pending.reduce((a, b) => (currentCounts[a] <= currentCounts[b] ? a : b));
    const { grid, solution, tier: actualTier, score } = generatePuzzle(TIER_CLUE_HINTS[tier]);
    attempts++;

    if (currentCounts[actualTier] < target && tiers.includes(actualTier)) {
      await db.insert(puzzles).values({
        id: randomUUID(),
        grid,
        solution,
        difficultyTier: actualTier,
        puzzleScore: score,
      });
      currentCounts[actualTier]++;
      printProgress(currentCounts, target, tiers);

      // Remove tier from pending if target reached
      const idx = pending.indexOf(actualTier);
      if (idx !== -1 && currentCounts[actualTier] >= target) {
        pending.splice(idx, 1);
      }
    }
  }

  console.log(`\nDone. Generated puzzles in ${attempts} attempts.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
