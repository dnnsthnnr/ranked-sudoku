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
  return [...rows(grid), ...cols(grid), ...boxes(grid)].every(isCompleteGroup);
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

const VALID_TIERS: DifficultyTier[] = ["easy", "medium", "hard", "expert"];

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
    expect(generateSolved()).not.toBe(generateSolved());
  });
});

// ---------------------------------------------------------------------------
// generatePuzzle — returns tier and score alongside grid/solution
// ---------------------------------------------------------------------------

describe("generatePuzzle", () => {
  let grid: string;
  let solution: string;
  let tier: DifficultyTier;
  let score: number;

  beforeAll(async () => {
    ({ grid, solution, tier, score } = generatePuzzle());
  }, 60_000);

  it("returns 81-character strings for both grid and solution", () => {
    expect(grid).toHaveLength(81);
    expect(solution).toHaveLength(81);
  });

  it("solution is a valid complete sudoku", () => {
    expect(isValidSolution(solution)).toBe(true);
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

  it("tier is a valid difficulty tier", () => {
    expect(VALID_TIERS).toContain(tier);
  });

  it("score is a non-negative integer", () => {
    expect(score).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(score)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// generatePuzzle with target clue count hint
// ---------------------------------------------------------------------------

describe("generatePuzzle with clue hint", () => {
  it("respects target clue count when possible (40 clues → easy-range puzzle)", () => {
    const { grid, tier, score } = generatePuzzle(40);
    const clues = grid.split("").filter((c) => c !== "0").length;
    expect(clues).toBeGreaterThanOrEqual(40);
    expect(["easy", "medium"] as DifficultyTier[]).toContain(tier);
    expect(score).toBeGreaterThanOrEqual(0);
  }, 30_000);
});

// ---------------------------------------------------------------------------
// removeClues — clue-count contract
// ---------------------------------------------------------------------------

describe("removeClues", () => {
  it("removes clues to at least the target count from a known solution", () => {
    const solution = generateSolved();
    const targetClues = 30;
    const puzzle = removeClues(solution, targetClues);
    const clues = puzzle.split("").filter((c) => c !== "0").length;
    expect(clues).toBeGreaterThanOrEqual(targetClues);
  }, 60_000);

  it("maintains a uniquely solvable puzzle after clue removal", () => {
    const solution = generateSolved();
    const puzzle = removeClues(solution, 35);
    const cells = puzzle.split("").map(Number);
    expect(countSolutions(cells)).toBe(1);
  }, 60_000);
});
