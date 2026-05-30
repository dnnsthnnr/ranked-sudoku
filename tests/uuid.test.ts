import { describe, it, expect } from "vitest";
import { replayKey } from "@/lib/uuid";

describe("replayKey", () => {
  const solvedAt = new Date("2026-05-30T14:23:00Z").getTime();

  it("is prefixed with the ISO date of solvedAt", () => {
    expect(replayKey(solvedAt)).toMatch(/^2026-05-30_/);
  });

  it("has a valid UUIDv4 after the date prefix", () => {
    const key = replayKey(solvedAt);
    const uuid = key.slice("2026-05-30_".length);
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("produces unique keys on each call", () => {
    expect(replayKey(solvedAt)).not.toBe(replayKey(solvedAt));
  });

  it("keys from the same day share the same prefix", () => {
    const morning = new Date("2026-05-30T08:00:00Z").getTime();
    const evening = new Date("2026-05-30T22:00:00Z").getTime();
    expect(replayKey(morning).slice(0, 10)).toBe(replayKey(evening).slice(0, 10));
  });

  it("keys from different days have different prefixes", () => {
    const day1 = new Date("2026-05-30T12:00:00Z").getTime();
    const day2 = new Date("2026-05-31T12:00:00Z").getTime();
    expect(replayKey(day1).slice(0, 10)).not.toBe(replayKey(day2).slice(0, 10));
  });

  it("sorts lexicographically by date", () => {
    const older = replayKey(new Date("2026-01-01T00:00:00Z").getTime());
    const newer = replayKey(new Date("2026-12-31T00:00:00Z").getTime());
    expect(older < newer).toBe(true);
  });
});
