import { describe, it, expect } from "vitest";
import { countGhostFillsAt, computeEffectiveTime, MISTAKE_PENALTY_MS, type ReplayMove } from "@/lib/replay";

function move(cellIndex: number, value: number, timestamp: number, isMistake: boolean): ReplayMove {
  return { cellIndex, value, timestamp, isMistake };
}

describe("countGhostFillsAt", () => {
  it("returns 0 for an empty move list", () => {
    expect(countGhostFillsAt([], 999_999)).toBe(0);
  });

  it("counts all correct moves when all are before playerEffectiveMs", () => {
    const moves = [
      move(0, 5, 1_000, false),
      move(1, 3, 2_000, false),
      move(2, 7, 3_000, false),
    ];
    expect(countGhostFillsAt(moves, 5_000)).toBe(3);
  });

  it("includes a correct move exactly at playerEffectiveMs", () => {
    const moves = [move(0, 5, 1_000, false)];
    expect(countGhostFillsAt(moves, 1_000)).toBe(1);
  });

  it("excludes a correct move 1ms after playerEffectiveMs", () => {
    const moves = [move(0, 5, 1_001, false)];
    expect(countGhostFillsAt(moves, 1_000)).toBe(0);
  });

  it("does not count mistake moves in filled count", () => {
    const moves = [
      move(0, 4, 1_000, true),  // wrong digit
      move(0, 5, 2_000, false), // correction
    ];
    // At 2000ms effective: ghost mistake shifts correction to 2000 + MISTAKE_PENALTY_MS
    // so only the correction is visible past that threshold
    expect(countGhostFillsAt(moves, 1_000)).toBe(0);
    expect(countGhostFillsAt(moves, 2_000 + MISTAKE_PENALTY_MS)).toBe(1);
  });

  it("shifts effective timestamps for moves after a ghost mistake", () => {
    // Ghost makes mistake at t=1000 (raw), then fills at t=2000 (raw)
    // Ghost's effective ts for the correction = 2000 + 1 * MISTAKE_PENALTY_MS
    const moves = [
      move(0, 4, 1_000, true),
      move(0, 5, 2_000, false),
    ];
    // Player at effectiveMs = 2000 + MISTAKE_PENALTY_MS - 1 → correction not yet visible
    expect(countGhostFillsAt(moves, 2_000 + MISTAKE_PENALTY_MS - 1)).toBe(0);
    // Player at effectiveMs = 2000 + MISTAKE_PENALTY_MS → correction now visible
    expect(countGhostFillsAt(moves, 2_000 + MISTAKE_PENALTY_MS)).toBe(1);
  });

  it("accumulates 2 × MISTAKE_PENALTY_MS for two ghost mistakes", () => {
    const moves = [
      move(0, 9, 1_000, true),   // mistake 1
      move(0, 5, 2_000, false),  // fill 1 — effective: 2000 + MISTAKE_PENALTY_MS
      move(1, 8, 3_000, true),   // mistake 2
      move(1, 3, 4_000, false),  // fill 2 — effective: 4000 + 2 * MISTAKE_PENALTY_MS
    ];
    const afterFirst = 2_000 + MISTAKE_PENALTY_MS;
    const afterSecond = 4_000 + 2 * MISTAKE_PENALTY_MS;

    expect(countGhostFillsAt(moves, afterFirst)).toBe(1);
    expect(countGhostFillsAt(moves, afterSecond)).toBe(2);
  });

  it("returns all correct moves when playerEffectiveMs >= ghost's effective finish time", () => {
    const moves = [
      move(0, 5, 1_000, false),
      move(1, 3, 2_000, false),
      move(2, 7, 3_000, false),
    ];
    expect(countGhostFillsAt(moves, 999_999)).toBe(3);
  });
});

describe("computeEffectiveTime", () => {
  it("returns 0 for an empty move list", () => {
    expect(computeEffectiveTime([])).toBe(0);
  });

  it("equals the last move timestamp when there are no mistakes", () => {
    const moves = [
      move(0, 5, 1_000, false),
      move(1, 3, 2_500, false),
      move(2, 7, 4_000, false),
    ];
    expect(computeEffectiveTime(moves)).toBe(4_000);
  });

  it("adds MISTAKE_PENALTY_MS once for 1 mistake", () => {
    const moves = [
      move(0, 9, 1_000, true),
      move(0, 5, 1_500, false),
      move(1, 3, 3_000, false),
    ];
    expect(computeEffectiveTime(moves)).toBe(3_000 + MISTAKE_PENALTY_MS);
  });

  it("adds 3 × MISTAKE_PENALTY_MS for 3 mistakes", () => {
    const moves = [
      move(0, 9, 1_000, true),
      move(0, 5, 1_500, false),
      move(1, 8, 2_000, true),
      move(1, 3, 2_500, false),
      move(2, 6, 3_000, true),
      move(2, 7, 3_500, false),
    ];
    expect(computeEffectiveTime(moves)).toBe(3_500 + 3 * MISTAKE_PENALTY_MS);
  });

  it("uses the last CORRECT move's timestamp (ignores trailing mistakes)", () => {
    const moves = [
      move(0, 5, 1_000, false),
      move(1, 9, 2_000, true), // trailing mistake
    ];
    // effectiveTime = lastCorrect.timestamp + 1 * MISTAKE_PENALTY_MS
    expect(computeEffectiveTime(moves)).toBe(1_000 + MISTAKE_PENALTY_MS);
  });
});
