import { describe, it, expect } from "vitest";
import { computeLeadPct } from "@/lib/lead";

const GHOST_EFFECTIVE_MS = 210_000; // 3m 30s
const TOTAL_CELLS = 60;

describe("computeLeadPct", () => {
  it("returns 50 at the very start (no cells filled, no time elapsed)", () => {
    expect(computeLeadPct(0, TOTAL_CELLS, 0, 0, GHOST_EFFECTIVE_MS)).toBe(50);
  });

  it("returns 50 when player fraction equals ghost time fraction", () => {
    // At 105 s elapsed (half of ghost's 210 s), player has filled 30 of 60 cells (50%)
    // ghostTimeFraction = 105/210 = 0.5, playerFraction = 30/60 = 0.5 → tied
    const pct = computeLeadPct(30, TOTAL_CELLS, 105_000, 0, GHOST_EFFECTIVE_MS);
    expect(pct).toBeCloseTo(50, 1);
  });

  it("is above 50 when player leads (filling faster than ghost's pace)", () => {
    // At 105 s, player has filled 36 cells (60%) — ahead of ghost's 50% time fraction
    const pct = computeLeadPct(36, TOTAL_CELLS, 105_000, 0, GHOST_EFFECTIVE_MS);
    expect(pct).toBeGreaterThan(50);
  });

  it("is below 50 when ghost leads (player filling slower than ghost's pace)", () => {
    // At 105 s, player has filled 24 cells (40%) — behind ghost's 50% time fraction
    const pct = computeLeadPct(24, TOTAL_CELLS, 105_000, 0, GHOST_EFFECTIVE_MS);
    expect(pct).toBeLessThan(50);
  });

  it("shows overwhelming dominance when player is near done with large time to spare", () => {
    // Player at 2m 20s (140 s), 95% cells filled; ghost total 3m 30s
    // ghostTimeFraction = 140/210 ≈ 0.667, playerFraction = 0.95
    // diff = 0.283 → leadPct ≈ 50 + 0.283*150 = 92.5
    const pct = computeLeadPct(57, TOTAL_CELLS, 140_000, 0, GHOST_EFFECTIVE_MS);
    expect(pct).toBeGreaterThan(85);
  });

  it("shows a clear but not overwhelming lead for a 30s win on a 3:30 ghost", () => {
    // Player finishing at 3:00 (180 s), 100% cells; ghost at 3:30
    // ghostTimeFraction = 180/210 ≈ 0.857, playerFraction = 1.0
    // diff = 0.143 → leadPct ≈ 50 + 21.4 = 71.4
    const pct = computeLeadPct(TOTAL_CELLS, TOTAL_CELLS, 180_000, 0, GHOST_EFFECTIVE_MS);
    expect(pct).toBeGreaterThan(60);
    expect(pct).toBeLessThanOrEqual(100);
  });

  it("adds penalty to elapsed time when player has mistakes", () => {
    // Same raw elapsed as above (180 s) but with 2 mistakes = +20 s penalty
    // effectiveElapsedMs = 200 s; ghostTimeFraction = 200/210 ≈ 0.952
    // If player is at 100% cells: diff = 1.0 - 0.952 = 0.048 → leadPct ≈ 57
    const withMistakes = computeLeadPct(TOTAL_CELLS, TOTAL_CELLS, 180_000, 2, GHOST_EFFECTIVE_MS);
    const withoutMistakes = computeLeadPct(TOTAL_CELLS, TOTAL_CELLS, 180_000, 0, GHOST_EFFECTIVE_MS);
    expect(withMistakes).toBeLessThan(withoutMistakes);
  });

  it("clamps to 0 when ghost time has expired and player is not finished", () => {
    // effectiveElapsedMs = 210 s (ghost's full time), player only at 50%
    // ghostTimeFraction = 1.0, playerFraction = 0.5 → diff = -0.5 → leadPct = 50 - 75 = -25 → 0
    const pct = computeLeadPct(30, TOTAL_CELLS, 210_000, 0, GHOST_EFFECTIVE_MS);
    expect(pct).toBe(0);
  });

  it("clamps to 100 when player finishes far ahead of a very slow ghost", () => {
    // Player finished (100%), ghost effective time is 10x player's elapsed → overwhelming
    const pct = computeLeadPct(TOTAL_CELLS, TOTAL_CELLS, 60_000, 0, 600_000);
    expect(pct).toBe(100);
  });

  it("returns 50 for edge-case of zero totalCells or zero ghostEffectiveTime", () => {
    expect(computeLeadPct(0, 0, 100_000, 0, GHOST_EFFECTIVE_MS)).toBe(50);
    expect(computeLeadPct(30, TOTAL_CELLS, 100_000, 0, 0)).toBe(50);
  });
});
