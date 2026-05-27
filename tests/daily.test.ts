import { describe, it, expect, beforeAll } from "vitest";
import { pickTierForDate } from "@/lib/daily";
import { DrizzlePuzzleRepository } from "@/repositories/drizzle/puzzle.repository";
import { DrizzleDailyGameRepository } from "@/repositories/drizzle/daily-game.repository";
import { createTestDb } from "./helpers/db";

describe("pickTierForDate", () => {
  it("returns a valid difficulty tier", () => {
    const tier = pickTierForDate("2026-05-27");
    expect(["easy", "medium", "hard"]).toContain(tier);
  });

  it("is deterministic — same date always produces the same tier", () => {
    const date = "2026-05-27";
    expect(pickTierForDate(date)).toBe(pickTierForDate(date));
  });

  it("produces different tiers for different dates", () => {
    // Generate 90 consecutive dates and verify all three tiers appear
    const tiers = new Set<string>();
    for (let i = 0; i < 90; i++) {
      const d = new Date(2026, 0, 1 + i);
      tiers.add(pickTierForDate(d.toISOString().split("T")[0]));
    }
    expect(tiers).toContain("easy");
    expect(tiers).toContain("medium");
    expect(tiers).toContain("hard");
  });
});

describe("Daily puzzle flow", () => {
  let puzzleRepo: DrizzlePuzzleRepository;
  let dailyGameRepo: DrizzleDailyGameRepository;

  beforeAll(async () => {
    const { db } = await createTestDb();
    puzzleRepo = new DrizzlePuzzleRepository(db);
    dailyGameRepo = new DrizzleDailyGameRepository(db);
  });

  it("stores and retrieves a daily game for a given date and tier", async () => {
    await puzzleRepo.insert([
      { id: "p-daily-1", grid: "1".repeat(81), solution: "2".repeat(81), difficultyTier: "medium" },
    ]);
    await dailyGameRepo.insert({ id: "dg-1", puzzleId: "p-daily-1", tier: "medium", date: "2026-05-27" });

    const result = await dailyGameRepo.findByDate("2026-05-27", "medium");
    expect(result).not.toBeNull();
    expect(result?.puzzleId).toBe("p-daily-1");
    expect(result?.tier).toBe("medium");
  });

  it("returns null when no daily game exists for a date", async () => {
    const result = await dailyGameRepo.findByDate("1999-01-01", "easy");
    expect(result).toBeNull();
  });

  it("resolves the correct puzzle for today via pickTierForDate", async () => {
    const date = "2026-06-01";
    const tier = pickTierForDate(date);

    await puzzleRepo.insert([
      { id: "p-daily-2", grid: "3".repeat(81), solution: "4".repeat(81), difficultyTier: tier },
    ]);
    await dailyGameRepo.insert({ id: "dg-2", puzzleId: "p-daily-2", tier, date });

    const game = await dailyGameRepo.findByDate(date, tier);
    expect(game).not.toBeNull();

    const puzzle = await puzzleRepo.findById(game!.puzzleId);
    expect(puzzle?.difficultyTier).toBe(tier);
  });

  it("does not return a daily game when queried for the wrong tier", async () => {
    // "2026-05-27" was seeded as "medium" above; querying "easy" should return null
    const result = await dailyGameRepo.findByDate("2026-05-27", "easy");
    expect(result).toBeNull();
  });
});
