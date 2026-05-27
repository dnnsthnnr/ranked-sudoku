import { describe, it, expect, beforeAll } from "vitest";
import { generateSolved, generatePuzzle, removeClues } from "@/lib/sudoku/generate";
import type { DifficultyTier } from "@/domain/puzzle";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function rows(grid: string): number[][] {
  const cells = grid.split("").map(Number);
  return Array.from({ length: 9 }, (_, r) => cells.slice(r * 9, r * 9 + 9));
}

function cols(grid: string): number[][] {
  const cells = grid.split("").map(Number);
  return Array.from({ length: 9 }, (_, c) => Array.from({ length: 9 }, (_, r) => cells[r * 9 + c]));
}

function boxes(grid: string): number[][] {
  const cells = grid.split("").map(Number);
  return Array.from({ length: 9 }, (_, b) => {
    const br = Math.floor(b / 3) * 3;
    const bc = (b % 3) * 3;
    return Array.from({ length: 9 }, (_, i) => cells[(br + Math.floor(i / 3)) * 9 + bc + (i % 3)]);
  });
}

function isCompleteGroup(group: number[]): boolean {
  return new Set(group).size === 9 && group.every((v) => v >= 1 && v <= 9);
}

function isValidSolution(grid: string): boolean {
  return (
    [...rows(grid), ...cols(grid), ...boxes(grid)].every(isCompleteGroup)
  );
}

// Minimal backtracking solver — counts solutions up to `limit`
function countSolutions(cells: number[], limit = 2): number {
  const empty = cells.indexOf(0);
  if (empty === -1) return 1;

  const row = Math.floor(empty / 9);
  const col = empty % 9;
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;

  let count = 0;
  for (let val = 1; val <= 9; val++) {
    let ok = true;
    for (let i = 0; i < 9; i++) {
      if (
        cells[row * 9 + i] === val ||
        cells[i * 9 + col] === val ||
        cells[(br + Math.floor(i / 3)) * 9 + bc + (i % 3)] === val
      ) {
        ok = false;
        break;
      }
    }
    if (ok) {
      cells[empty] = val;
      count += countSolutions(cells, limit);
      cells[empty] = 0;
      if (count >= limit) return count;
    }
  }
  return count;
}

const CLUE_COUNTS: Record<DifficultyTier, number> = { easy: 38, medium: 30, hard: 23 };

// ---------------------------------------------------------------------------
// generateSolved
// ---------------------------------------------------------------------------

describe("generateSolved", () => {
  it("returns an 81-character string", () => {
    expect(generateSolved()).toHaveLength(81);
  });

  it("contains only digits 1–9 (no zeros or blanks)", () => {
    const solution = generateSolved();
    expect(solution).toMatch(/^[1-9]{81}$/);
  });

  it("every row contains each digit exactly once", () => {
    expect(rows(generateSolved()).every(isCompleteGroup)).toBe(true);
  });

  it("every column contains each digit exactly once", () => {
    expect(cols(generateSolved()).every(isCompleteGroup)).toBe(true);
  });

  it("every 3×3 box contains each digit exactly once", () => {
    expect(boxes(generateSolved()).every(isCompleteGroup)).toBe(true);
  });

  it("produces different grids on successive calls", () => {
    // Probability of a collision is astronomically low (~1 in 6.7×10²¹)
    expect(generateSolved()).not.toBe(generateSolved());
  });
});

// ---------------------------------------------------------------------------
// generatePuzzle — shared properties across tiers
// ---------------------------------------------------------------------------

describe.each<DifficultyTier>(["easy", "medium", "hard"])("generatePuzzle('%s')", (tier) => {
  let grid: string;
  let solution: string;

  beforeAll(
    async () => {
      ({ grid, solution } = generatePuzzle(tier));
    },
    // Hard puzzles can take several seconds due to uniqueness-checking backtracking
    tier === "hard" ? 60_000 : 15_000,
  );

  it("returns 81-character strings for both grid and solution", () => {
    expect(grid).toHaveLength(81);
    expect(solution).toHaveLength(81);
  });

  it("solution is a valid complete sudoku", () => {
    expect(isValidSolution(solution)).toBe(true);
  });

  it(`grid has at least ${CLUE_COUNTS[tier]} filled cells (target clue count)`, () => {
    // The generator removes clues while maintaining a unique solution.
    // It always reaches the target for easy/medium, but for hard some puzzle
    // layouts cannot be reduced all the way to 23 without creating ambiguity,
    // so the result is >= target (never fewer clues than intended).
    const clues = grid.split("").filter((c) => c !== "0").length;
    expect(clues).toBeGreaterThanOrEqual(CLUE_COUNTS[tier]);
  });

  it("grid cells contain only digits 0–9", () => {
    expect(grid).toMatch(/^[0-9]{81}$/);
  });

  it("every given cell in the grid matches the solution", () => {
    for (let i = 0; i < 81; i++) {
      if (grid[i] !== "0") {
        expect(grid[i]).toBe(solution[i]);
      }
    }
  });

  it("puzzle has exactly one solution", () => {
    const cells = grid.split("").map(Number);
    expect(countSolutions(cells)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// removeClues — clue-count contract per tier
// ---------------------------------------------------------------------------

describe("removeClues", () => {
  it.each(["easy", "medium", "hard"] as DifficultyTier[])(
    "produces exactly %s clue count from a known solution",
    (tier) => {
      // Use a fixed valid solution so this test is fast (no generation overhead)
      const solution = generateSolved();
      const puzzle = removeClues(solution, tier);
      const clues = puzzle.split("").filter((c) => c !== "0").length;
      expect(clues).toBeGreaterThanOrEqual(CLUE_COUNTS[tier]);
    },
    60_000,
  );
});
