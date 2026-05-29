import { describe, it, expect } from "vitest";
import { scorePuzzle } from "@/lib/sudoku/difficulty";
import { generateSolved } from "@/lib/sudoku/generate";

// Arto Inkala's AI Escargot — requires backtracking, universally classified Expert.
const EXPERT_PUZZLE =
  "800000000003600000070090200060005030000300007006080000000017000080000010020400600";

describe("scorePuzzle", () => {
  it("returns Easy for a puzzle with one empty cell (guaranteed naked single)", () => {
    const solution = generateSolved();
    // Remove one cell — the only possible value is a naked single.
    const grid = solution.substring(0, 40) + "0" + solution.substring(41);
    const result = scorePuzzle(grid);
    expect(result.tier).toBe("easy");
    expect(result.score).toBeGreaterThan(0);
    expect(result.techniques.length).toBeGreaterThan(0);
    expect(result.techniques[0].name).toBe("nakedSingle");
  });

  it("returns Easy for an almost-complete grid solved entirely by naked singles", () => {
    const solution = generateSolved();
    // Remove one cell from each row — still resolvable by naked singles.
    let grid = solution;
    for (let r = 0; r < 9; r++) {
      const pos = r * 9 + r;
      grid = grid.substring(0, pos) + "0" + grid.substring(pos + 1);
    }
    const result = scorePuzzle(grid);
    expect(result.tier).toBe("easy");
    expect(result.score).toBeGreaterThan(0);
  }, 10_000);

  it("classifies Arto Inkala's AI Escargot as Hard or Expert (requires advanced techniques)", () => {
    const result = scorePuzzle(EXPERT_PUZZLE);
    expect(["hard", "expert"]).toContain(result.tier);
    expect(result.score).toBeGreaterThan(0);
  }, 30_000);

  it("score is higher for a harder puzzle than for a trivial puzzle", () => {
    const solution = generateSolved();
    const trivial = solution.substring(0, 80) + "0";
    const trivialResult = scorePuzzle(trivial);
    const expertResult = scorePuzzle(EXPERT_PUZZLE);
    expect(expertResult.score).toBeGreaterThan(trivialResult.score);
  }, 30_000);

  it("returns tier easy with score 0 for a fully solved grid", () => {
    const solution = generateSolved();
    const result = scorePuzzle(solution);
    expect(result.tier).toBe("easy");
    expect(result.score).toBe(0);
    expect(result.techniques).toHaveLength(0);
  });

  it("techniques array contains only valid technique names", () => {
    const validNames = new Set([
      "nakedSingle", "hiddenSingle", "pointingPair", "nakedPair",
      "hiddenPair", "nakedTriple", "hiddenTriple", "xWing", "swordfish", "chain",
    ]);
    const result = scorePuzzle(EXPERT_PUZZLE);
    for (const t of result.techniques) {
      expect(validNames.has(t.name)).toBe(true);
      expect(t.weight).toBeGreaterThan(0);
    }
  }, 30_000);
});
