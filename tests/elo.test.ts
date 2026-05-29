import { describe, it, expect } from "vitest";
import { computeEloChange, expectedScore } from "@/lib/elo";

describe("expectedScore", () => {
  it("returns 0.5 for equal ELOs", () => {
    expect(expectedScore(800, 800)).toBeCloseTo(0.5);
  });

  it("returns > 0.5 when player ELO is higher", () => {
    expect(expectedScore(900, 800)).toBeGreaterThan(0.5);
  });

  it("returns < 0.5 when player ELO is lower", () => {
    expect(expectedScore(700, 800)).toBeLessThan(0.5);
  });

  it("is symmetric: p(a,b) + p(b,a) = 1", () => {
    expect(expectedScore(750, 900) + expectedScore(900, 750)).toBeCloseTo(1);
  });
});

describe("computeEloChange", () => {
  it("uses K=32 during placement phase (raceCount < 16)", () => {
    // Equal ELOs: change = K * (1 - 0.5) = K/2
    expect(computeEloChange(800, 800, "win", 0)).toBe(16); // K=32 * 0.5
    expect(computeEloChange(800, 800, "loss", 0)).toBe(-16);
  });

  it("uses K=16 after placement phase (raceCount >= 16)", () => {
    expect(computeEloChange(800, 800, "win", 16)).toBe(8); // K=16 * 0.5
    expect(computeEloChange(800, 800, "loss", 16)).toBe(-8);
  });

  it("placement phase ends at exactly race 16", () => {
    const atEnd = computeEloChange(800, 800, "win", 15); // last placement race
    const afterEnd = computeEloChange(800, 800, "win", 16);
    expect(atEnd).toBe(16);
    expect(afterEnd).toBe(8);
  });

  it("win against stronger opponent gains more than against weaker", () => {
    const vsStronger = computeEloChange(800, 1000, "win", 20);
    const vsWeaker = computeEloChange(800, 600, "win", 20);
    expect(vsStronger).toBeGreaterThan(vsWeaker);
  });

  it("loss to weaker opponent loses more than to stronger", () => {
    const vsWeaker = computeEloChange(800, 600, "loss", 20);
    const vsStronger = computeEloChange(800, 1000, "loss", 20);
    expect(vsWeaker).toBeLessThan(vsStronger);
  });

  it("forfeit counts as a loss (outcome=0)", () => {
    expect(computeEloChange(800, 800, "forfeit", 20)).toBe(
      computeEloChange(800, 800, "loss", 20),
    );
  });

  it("ELO is zero-sum for a win/loss pair at equal ELO", () => {
    const gain = computeEloChange(800, 800, "win", 20);
    const loss = computeEloChange(800, 800, "loss", 20);
    expect(gain + loss).toBe(0);
  });
});
