import { describe, it, expect, beforeAll } from "vitest";
import { DrizzlePuzzleRepository } from "@/repositories/drizzle/puzzle.repository";
import { createTestDb } from "../helpers/db";

describe("DrizzlePuzzleRepository", () => {
  let repo: DrizzlePuzzleRepository;

  beforeAll(async () => {
    const { controlDb } = await createTestDb();
    repo = new DrizzlePuzzleRepository(controlDb);
  });

  it("inserts and retrieves a puzzle by id", async () => {
    await repo.insert([
      { id: "p1", grid: "1".repeat(81), solution: "2".repeat(81), difficultyTier: "easy" },
    ]);
    const result = await repo.findById("p1");
    expect(result?.id).toBe("p1");
    expect(result?.difficultyTier).toBe("easy");
  });

  it("returns null for unknown id", async () => {
    const result = await repo.findById("does-not-exist");
    expect(result).toBeNull();
  });

  it("filters puzzles by difficulty tier", async () => {
    await repo.insert([
      { id: "p2", grid: "3".repeat(81), solution: "4".repeat(81), difficultyTier: "hard" },
      { id: "p3", grid: "5".repeat(81), solution: "6".repeat(81), difficultyTier: "easy" },
    ]);
    const hard = await repo.findByDifficulty("hard");
    expect(hard.every((p) => p.difficultyTier === "hard")).toBe(true);
  });
});
