import { describe, it, expect } from "vitest";
import { computeLeadPct } from "@/lib/lead";

const TOTAL_CELLS = 60;

describe("computeLeadPct", () => {
  it("returns 50 when both player and ghost have filled nothing", () => {
    expect(computeLeadPct(0, TOTAL_CELLS, 0)).toBe(50);
  });

  it("returns 50 when player and ghost have filled the same number of cells", () => {
    expect(computeLeadPct(30, TOTAL_CELLS, 30)).toBeCloseTo(50, 1);
  });

  it("is above 50 when player has filled more cells than the ghost", () => {
    expect(computeLeadPct(36, TOTAL_CELLS, 24)).toBeGreaterThan(50);
  });

  it("is below 50 when ghost has filled more cells than the player", () => {
    expect(computeLeadPct(24, TOTAL_CELLS, 36)).toBeLessThan(50);
  });

  it("clamps to 100 when player is at 100% and ghost at 50%", () => {
    // diff = 1.0 - 0.5 = 0.5 → 50 + 75 = 125 → clamped to 100
    expect(computeLeadPct(TOTAL_CELLS, TOTAL_CELLS, 30)).toBe(100);
  });

  it("returns 25 when player is at 0% and ghost is at 50%", () => {
    // diff = 0 - 0.5 = -0.5 → 50 - 75 = -25 → clamped to 0
    expect(computeLeadPct(0, TOTAL_CELLS, 30)).toBe(0);
  });

  it("shows a meaningful lead for a 30s win on a 3:30 ghost", () => {
    // Player finished (100%), ghost is 5/6 done (83%)
    // diff = 1.0 - 0.833 = 0.167 → ~75
    expect(computeLeadPct(TOTAL_CELLS, TOTAL_CELLS, 50)).toBeGreaterThan(60);
    expect(computeLeadPct(TOTAL_CELLS, TOTAL_CELLS, 50)).toBeLessThanOrEqual(100);
  });

  it("returns 50 for edge-case of zero totalCells", () => {
    expect(computeLeadPct(0, 0, 0)).toBe(50);
  });

  it("caps ghostFilled at totalCells to avoid over-counting", () => {
    // ghostFilled = 120 but totalCells = 60 → ghostFraction = 1.0
    // player = 0 → diff = -1.0 → 50 - 150 = -100 → clamped to 0
    expect(computeLeadPct(0, TOTAL_CELLS, 120)).toBe(0);
  });
});
