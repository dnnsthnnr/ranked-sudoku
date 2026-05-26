export type DifficultyTier = "easy" | "medium" | "hard";

const CLUE_COUNTS: Record<DifficultyTier, number> = {
  easy: 38,
  medium: 30,
  hard: 23,
};

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function isValid(grid: number[], pos: number, val: number): boolean {
  const row = Math.floor(pos / 9);
  const col = pos % 9;
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;

  for (let i = 0; i < 9; i++) {
    if (grid[row * 9 + i] === val) return false;
    if (grid[i * 9 + col] === val) return false;
    if (grid[(boxRow + Math.floor(i / 3)) * 9 + boxCol + (i % 3)] === val)
      return false;
  }
  return true;
}

function fillGrid(grid: number[]): boolean {
  const empty = grid.indexOf(0);
  if (empty === -1) return true;

  for (const val of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
    if (isValid(grid, empty, val)) {
      grid[empty] = val;
      if (fillGrid(grid)) return true;
      grid[empty] = 0;
    }
  }
  return false;
}

function countSolutions(grid: number[], limit = 2): number {
  const empty = grid.indexOf(0);
  if (empty === -1) return 1;

  let count = 0;
  for (let val = 1; val <= 9; val++) {
    if (isValid(grid, empty, val)) {
      grid[empty] = val;
      count += countSolutions(grid, limit);
      grid[empty] = 0;
      if (count >= limit) return count;
    }
  }
  return count;
}

export function generateSolved(): string {
  const grid = new Array(81).fill(0);
  fillGrid(grid);
  return grid.join("");
}

export function removeClues(solution: string, tier: DifficultyTier): string {
  const grid = solution.split("").map(Number);
  const targetClues = CLUE_COUNTS[tier];
  const toRemove = 81 - targetClues;

  const positions = shuffle(Array.from({ length: 81 }, (_, i) => i));
  let removed = 0;

  for (const pos of positions) {
    if (removed >= toRemove) break;
    const backup = grid[pos];
    grid[pos] = 0;

    if (countSolutions([...grid]) === 1) {
      removed++;
    } else {
      grid[pos] = backup;
    }
  }

  return grid.join("");
}

export function generatePuzzle(tier: DifficultyTier): {
  grid: string;
  solution: string;
} {
  const solution = generateSolved();
  const grid = removeClues(solution, tier);
  return { grid, solution };
}
