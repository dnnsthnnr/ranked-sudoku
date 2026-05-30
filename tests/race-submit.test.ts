import { describe, it, expect, beforeAll } from "vitest";
import { DrizzlePlayerRepository } from "@/repositories/drizzle/player.repository";
import { DrizzleGhostRunRepository } from "@/repositories/drizzle/ghost-run.repository";
import { DrizzleRankedMatchRepository } from "@/repositories/drizzle/ranked-match.repository";
import { computeEloChange } from "@/lib/elo";
import { replayKey } from "@/lib/uuid";
import { createTestDb } from "./helpers/db";
import { puzzles } from "@/db/schema/control";

const PUZZLE_ID = "puzzle-race-test";
const GHOST_RUN_ID = "ghost-run-1";
const PLAYER_ID = "player-race-1";
const GHOST_PLAYER_ID = "player-ghost-1";
const STAMPED_ELO = 900;
const PLAYER_ELO = 800;

async function setupDb() {
  const db = await createTestDb();
  const playerRepo = new DrizzlePlayerRepository(db.controlDb);
  const ghostRunRepo = new DrizzleGhostRunRepository(db.controlDb, db.getPlayerDb);
  const matchRepo = new DrizzleRankedMatchRepository(db.getPlayerDb);

  await db.controlDb.insert(puzzles).values({
    id: PUZZLE_ID,
    grid: "1".repeat(81),
    solution: "2".repeat(81),
    difficultyTier: "medium",
  });

  await playerRepo.upsert({
    id: PLAYER_ID,
    elo: PLAYER_ELO,
    raceCount: 0,
    skillLevel: "intermediate",
    userDbId: db.defaultUserDbId,
  });

  await playerRepo.upsert({
    id: GHOST_PLAYER_ID,
    elo: STAMPED_ELO,
    raceCount: 5,
    skillLevel: "intermediate",
    userDbId: db.defaultUserDbId,
  });

  await ghostRunRepo.insert({
    id: GHOST_RUN_ID,
    puzzleId: PUZZLE_ID,
    playerId: GHOST_PLAYER_ID,
    stampedElo: STAMPED_ELO,
    effectiveTime: 120_000,
    replayKey: "seed-key",
    source: "daily",
    isActiveInPool: true,
  });

  return { playerRepo, ghostRunRepo, matchRepo, ...db };
}

describe("race submit flow", () => {
  let ctx: Awaited<ReturnType<typeof setupDb>>;

  beforeAll(async () => {
    ctx = await setupDb();
  });

  it("computes correct ELO change for a win (placement phase)", () => {
    // raceCount=0, K=32, player 800 vs ghost 900 → expected < 0.5 → gain > 16
    const change = computeEloChange(PLAYER_ELO, STAMPED_ELO, "win", 0);
    expect(change).toBeGreaterThan(16);
  });

  it("computes correct ELO change for a loss (placement phase)", () => {
    const change = computeEloChange(PLAYER_ELO, STAMPED_ELO, "loss", 0);
    expect(change).toBeLessThan(0);
    // Losing to a stronger opponent costs less than K/2
    expect(change).toBeGreaterThan(-16);
  });

  it("inserts a ranked match record with correct elo fields", async () => {
    const eloBefore = PLAYER_ELO;
    const eloChange = computeEloChange(eloBefore, STAMPED_ELO, "win", 0);
    const eloAfter = eloBefore + eloChange;

    await ctx.matchRepo.insert({
      id: "match-1",
      playerId: PLAYER_ID,
      ghostRunId: GHOST_RUN_ID,
      opponentPlayerId: GHOST_PLAYER_ID,
      puzzleId: PUZZLE_ID,
      matchType: "ranked",
      outcome: "win",
      effectiveTime: 100_000,
      mistakes: 1,
      eloBefore,
      eloAfter,
    });

    const matches = await ctx.matchRepo.findByPlayer(PLAYER_ID);
    expect(matches).toHaveLength(1);
    expect(matches[0].eloBefore).toBe(eloBefore);
    expect(matches[0].eloAfter).toBe(eloAfter);
    expect(matches[0].outcome).toBe("win");
  });

  it("updates player ELO in DB after a win", async () => {
    const player = await ctx.playerRepo.findById(PLAYER_ID);
    const eloChange = computeEloChange(player!.elo, STAMPED_ELO, "win", player!.raceCount);
    const newElo = player!.elo + eloChange;
    await ctx.playerRepo.updateElo(PLAYER_ID, newElo, player!.raceCount + 1);

    const updated = await ctx.playerRepo.findById(PLAYER_ID);
    expect(updated?.elo).toBe(newElo);
    expect(updated?.raceCount).toBe(player!.raceCount + 1);
  });

  it("creates a winning ghost run with stamped post-win ELO", async () => {
    const SOLVE_AT = 1_700_000_000_000;
    const newElo = 825;
    const key = replayKey(SOLVE_AT);

    await ctx.ghostRunRepo.insert({
      id: "ghost-from-win",
      puzzleId: PUZZLE_ID,
      playerId: PLAYER_ID,
      stampedElo: newElo,
      effectiveTime: 100_000,
      replayKey: key,
      source: "ranked",
      isActiveInPool: true,
    });

    const run = await ctx.ghostRunRepo.findById("ghost-from-win");
    expect(run?.stampedElo).toBe(newElo);
    expect(run?.source).toBe("ranked");
    expect(run?.replayKey).toBe(key);
  });

  it("hasRaced prevents racing the same ghost run twice", async () => {
    expect(await ctx.matchRepo.hasRaced(PLAYER_ID, GHOST_RUN_ID)).toBe(true);
    expect(await ctx.matchRepo.hasRaced(PLAYER_ID, "nonexistent-ghost")).toBe(false);
  });

  it("forfeit records null effectiveTime and same ELO change as loss", async () => {
    const eloBefore = 800;
    const eloChange = computeEloChange(eloBefore, STAMPED_ELO, "forfeit", 20);
    const lossChange = computeEloChange(eloBefore, STAMPED_ELO, "loss", 20);
    expect(eloChange).toBe(lossChange);

    await ctx.matchRepo.insert({
      id: "match-forfeit",
      playerId: PLAYER_ID,
      ghostRunId: GHOST_RUN_ID,
      opponentPlayerId: GHOST_PLAYER_ID,
      puzzleId: PUZZLE_ID,
      matchType: "ranked",
      outcome: "forfeit",
      effectiveTime: null,
      mistakes: 0,
      eloBefore,
      eloAfter: eloBefore + eloChange,
    });

    const matches = await ctx.matchRepo.findByPlayer(PLAYER_ID);
    const forfeit = matches.find((m) => m.outcome === "forfeit");
    expect(forfeit?.effectiveTime).toBeNull();
  });
});

describe("daily submit flow", () => {
  it("creates a seed ghost run with player's current ELO stamped", async () => {
    const db = await createTestDb();
    const playerRepo = new DrizzlePlayerRepository(db.controlDb);
    const ghostRunRepo = new DrizzleGhostRunRepository(db.controlDb, db.getPlayerDb);

    await db.controlDb.insert(puzzles).values({
      id: "puzzle-daily-1",
      grid: "1".repeat(81),
      solution: "2".repeat(81),
      difficultyTier: "easy",
    });

    await playerRepo.upsert({
      id: "player-daily-1",
      elo: 650,
      raceCount: 3,
      skillLevel: "beginner",
      userDbId: db.defaultUserDbId,
    });

    const key = replayKey(1_700_000_001_000);

    await ghostRunRepo.insert({
      id: "ghost-daily-1",
      puzzleId: "puzzle-daily-1",
      playerId: "player-daily-1",
      stampedElo: 650,
      effectiveTime: 200_000,
      replayKey: key,
      source: "daily",
      isActiveInPool: true,
    });

    const run = await ghostRunRepo.findById("ghost-daily-1");
    expect(run?.source).toBe("daily");
    expect(run?.stampedElo).toBe(650);
    expect(run?.isActiveInPool).toBe(true);
    expect(run?.replayKey).toBe(key);
  });
});
