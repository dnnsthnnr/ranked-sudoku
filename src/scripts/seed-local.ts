import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { randomUUID } from "node:crypto";
import { generatePuzzle } from "@/lib/sudoku/generate";
import { LocalFileReplayStore, type ReplayData, type ReplayMove } from "@/lib/replay";
import { DrizzlePuzzleRepository } from "@/repositories/drizzle/puzzle.repository";
import { DrizzlePlayerRepository } from "@/repositories/drizzle/player.repository";
import { DrizzleGhostRunRepository } from "@/repositories/drizzle/ghost-run.repository";
import { DrizzleDailyGameRepository } from "@/repositories/drizzle/daily-game.repository";
import type { DifficultyTier } from "@/domain/puzzle";
import * as schema from "@/db/schema";

const DB_PATH = "file:./local.db";

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

// Box-Muller log-normal sample for human-like inter-move timing
function sampleLogNormal(meanMs: number, stdMs: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(Math.max(u1, 1e-9))) * Math.cos(2 * Math.PI * u2);
  const sigma = stdMs / meanMs;
  const mu = Math.log(meanMs);
  return Math.max(500, Math.round(Math.exp(mu + sigma * z)));
}

const TIMING: Record<DifficultyTier, { mean: number; std: number }> = {
  easy: { mean: 4_000, std: 2_000 },
  medium: { mean: 7_000, std: 3_000 },
  hard: { mean: 12_000, std: 5_000 },
};

function generateGhostMoves(
  puzzle: string,
  solution: string,
  tier: DifficultyTier,
): { moves: ReplayMove[]; solvedAt: number; mistakeCount: number } {
  const emptyCells = puzzle
    .split("")
    .map((v, i) => ({ i, v }))
    .filter((c) => c.v === "0");

  const moves: ReplayMove[] = [];
  let t = 0;
  let mistakeCount = 0;
  const { mean, std } = TIMING[tier];

  for (const { i } of emptyCells) {
    t += sampleLogNormal(mean, std);

    // ~8% chance of a mistake (wrong digit, then corrected)
    if (Math.random() < 0.08) {
      const correct = Number(solution[i]);
      const wrong = correct === 9 ? correct - 1 : correct + 1;
      moves.push({ cellIndex: i, value: wrong, timestamp: t, isMistake: true });
      mistakeCount++;
      t += 1_500;
    }

    moves.push({ cellIndex: i, value: Number(solution[i]), timestamp: t, isMistake: false });
  }

  return { moves, solvedAt: t, mistakeCount };
}

async function main() {
  const client = createClient({ url: DB_PATH });
  const db = drizzle(client, { schema });

  console.log("Running migrations on local.db...");
  await migrate(db, { migrationsFolder: "./drizzle" });

  const puzzleRepo = new DrizzlePuzzleRepository(db);
  const playerRepo = new DrizzlePlayerRepository(db);
  const ghostRunRepo = new DrizzleGhostRunRepository(db);
  const dailyGameRepo = new DrizzleDailyGameRepository(db);
  const replayStore = new LocalFileReplayStore();

  await playerRepo.upsert({
    id: "bot-player",
    elo: 800,
    raceCount: 50,
    skillLevel: "intermediate",
  });
  console.log("Bot player ready.");

  const today = todayISO();
  const tiers: DifficultyTier[] = ["easy", "medium", "hard"];

  for (const tier of tiers) {
    console.log(`Generating ${tier} puzzle...`);
    const { grid, solution } = generatePuzzle(tier);
    const puzzleId = randomUUID();
    const ghostRunId = randomUUID();

    await puzzleRepo.insert([{ id: puzzleId, grid, solution, difficultyTier: tier }]);
    await dailyGameRepo.insert({ id: randomUUID(), puzzleId, tier, date: today });

    const { moves, solvedAt, mistakeCount } = generateGhostMoves(grid, solution, tier);
    const effectiveTime = solvedAt + mistakeCount * 10_000;

    const replayData: ReplayData = { puzzleId, moves, effectiveTime, solvedAt };
    await replayStore.put(ghostRunId, replayData);

    await ghostRunRepo.insert({
      id: ghostRunId,
      puzzleId,
      playerId: "bot-player",
      stampedElo: 800,
      effectiveTime,
      replayR2Key: ghostRunId,
      isSeedRun: true,
    });

    console.log(
      `  ${tier}: ghostRun=${ghostRunId.slice(0, 8)}… effectiveTime=${Math.round(effectiveTime / 1000)}s (${mistakeCount} mistakes)`,
    );
  }

  console.log("\nDone. Run `pnpm dev` and open http://localhost:3000/daily");
  client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
