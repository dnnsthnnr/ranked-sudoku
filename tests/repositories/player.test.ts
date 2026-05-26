import { describe, it, expect, beforeAll } from "vitest";
import { DrizzlePlayerRepository } from "@/repositories/drizzle/player.repository";
import { createTestDb } from "../helpers/db";

describe("DrizzlePlayerRepository", () => {
  let repo: DrizzlePlayerRepository;

  beforeAll(async () => {
    const { db } = await createTestDb();
    repo = new DrizzlePlayerRepository(db);
  });

  it("upserts and retrieves a player", async () => {
    await repo.upsert({ id: "player-1", elo: 800, raceCount: 0, skillLevel: "intermediate" });
    const player = await repo.findById("player-1");
    expect(player?.id).toBe("player-1");
    expect(player?.elo).toBe(800);
    expect(player?.skillLevel).toBe("intermediate");
  });

  it("updates elo and race count on upsert", async () => {
    await repo.upsert({ id: "player-1", elo: 850, raceCount: 1, skillLevel: "intermediate" });
    const player = await repo.findById("player-1");
    expect(player?.elo).toBe(850);
    expect(player?.raceCount).toBe(1);
  });

  it("updates elo directly", async () => {
    await repo.upsert({ id: "player-2", elo: 600, raceCount: 0, skillLevel: "beginner" });
    await repo.updateElo("player-2", 620, 1);
    const player = await repo.findById("player-2");
    expect(player?.elo).toBe(620);
    expect(player?.raceCount).toBe(1);
  });

  it("returns null for unknown player", async () => {
    const result = await repo.findById("ghost");
    expect(result).toBeNull();
  });
});
