import type { DifficultyTier } from "@/domain/puzzle";

export interface TechniqueApplication {
  name: string;
  weight: number;
}

export interface PuzzleScore {
  tier: DifficultyTier;
  score: number;
  techniques: TechniqueApplication[];
}

const WEIGHTS: Record<string, number> = {
  nakedSingle: 1,
  hiddenSingle: 3,
  pointingPair: 5,
  nakedPair: 8,
  hiddenPair: 10,
  nakedTriple: 12,
  hiddenTriple: 15,
  xWing: 20,
  swordfish: 25,
  chain: 40,
};

function tierFromMaxWeight(w: number): DifficultyTier {
  if (w <= 1) return "easy";
  if (w <= 5) return "medium";
  if (w <= 15) return "hard";
  return "expert";
}

// ── Precomputed unit indices ────────────────────────────────────────────────

const ROWS: number[][] = Array.from({ length: 9 }, (_, r) =>
  Array.from({ length: 9 }, (_, c) => r * 9 + c),
);
const COLS: number[][] = Array.from({ length: 9 }, (_, c) =>
  Array.from({ length: 9 }, (_, r) => r * 9 + c),
);
const BOXES: number[][] = Array.from({ length: 9 }, (_, b) => {
  const br = Math.floor(b / 3) * 3;
  const bc = (b % 3) * 3;
  return Array.from({ length: 9 }, (_, i) => (br + Math.floor(i / 3)) * 9 + bc + (i % 3));
});

function cellBox(idx: number): number {
  return Math.floor(Math.floor(idx / 9) / 3) * 3 + Math.floor((idx % 9) / 3);
}

const PEERS: number[][] = Array.from({ length: 81 }, (_, i) => {
  const row = Math.floor(i / 9);
  const col = i % 9;
  const box = cellBox(i);
  const s = new Set<number>();
  for (const j of ROWS[row]) s.add(j);
  for (const j of COLS[col]) s.add(j);
  for (const j of BOXES[box]) s.add(j);
  s.delete(i);
  return [...s];
});

// ── Candidate tracking ──────────────────────────────────────────────────────

function initCandidates(grid: number[]): Set<number>[] {
  const cands: Set<number>[] = Array.from({ length: 81 }, () => new Set());
  for (let i = 0; i < 81; i++) {
    if (grid[i] === 0) {
      for (let d = 1; d <= 9; d++) cands[i].add(d);
    }
  }
  for (let i = 0; i < 81; i++) {
    if (grid[i] !== 0) {
      for (const p of PEERS[i]) cands[p].delete(grid[i]);
    }
  }
  return cands;
}

function placeValue(grid: number[], cands: Set<number>[], idx: number, val: number): void {
  grid[idx] = val;
  cands[idx].clear();
  for (const p of PEERS[idx]) cands[p].delete(val);
}

// ── Human solving techniques ────────────────────────────────────────────────

function applyNakedSingles(grid: number[], cands: Set<number>[]): number {
  let count = 0;
  for (let i = 0; i < 81; i++) {
    if (grid[i] === 0 && cands[i].size === 1) {
      placeValue(grid, cands, i, [...cands[i]][0]);
      count++;
    }
  }
  return count;
}

function applyHiddenSingles(grid: number[], cands: Set<number>[]): number {
  let count = 0;
  for (const unit of [...ROWS, ...COLS, ...BOXES]) {
    for (let d = 1; d <= 9; d++) {
      const cells = unit.filter((i) => grid[i] === 0 && cands[i].has(d));
      if (cells.length === 1) {
        placeValue(grid, cands, cells[0], d);
        count++;
      }
    }
  }
  return count;
}

function applyPointingPairs(grid: number[], cands: Set<number>[]): number {
  let count = 0;

  // Box → row/col: if a digit's candidates in a box all share one row or col,
  // eliminate that digit from the rest of that row or col.
  for (let b = 0; b < 9; b++) {
    const boxCells = BOXES[b];
    for (let d = 1; d <= 9; d++) {
      const cells = boxCells.filter((i) => grid[i] === 0 && cands[i].has(d));
      if (cells.length < 2) continue;

      const rowSet = new Set(cells.map((i) => Math.floor(i / 9)));
      if (rowSet.size === 1) {
        const r = [...rowSet][0];
        for (const idx of ROWS[r]) {
          if (!boxCells.includes(idx) && cands[idx].has(d)) {
            cands[idx].delete(d);
            count++;
          }
        }
      }

      const colSet = new Set(cells.map((i) => i % 9));
      if (colSet.size === 1) {
        const c = [...colSet][0];
        for (const idx of COLS[c]) {
          if (!boxCells.includes(idx) && cands[idx].has(d)) {
            cands[idx].delete(d);
            count++;
          }
        }
      }
    }
  }

  // Row → box: if a digit's candidates in a row all share one box,
  // eliminate that digit from the rest of that box.
  for (let r = 0; r < 9; r++) {
    for (let d = 1; d <= 9; d++) {
      const cells = ROWS[r].filter((i) => grid[i] === 0 && cands[i].has(d));
      if (cells.length < 2) continue;
      const boxSet = new Set(cells.map(cellBox));
      if (boxSet.size === 1) {
        const b = [...boxSet][0];
        for (const idx of BOXES[b]) {
          if (Math.floor(idx / 9) !== r && cands[idx].has(d)) {
            cands[idx].delete(d);
            count++;
          }
        }
      }
    }
  }

  // Col → box
  for (let c = 0; c < 9; c++) {
    for (let d = 1; d <= 9; d++) {
      const cells = COLS[c].filter((i) => grid[i] === 0 && cands[i].has(d));
      if (cells.length < 2) continue;
      const boxSet = new Set(cells.map(cellBox));
      if (boxSet.size === 1) {
        const b = [...boxSet][0];
        for (const idx of BOXES[b]) {
          if (idx % 9 !== c && cands[idx].has(d)) {
            cands[idx].delete(d);
            count++;
          }
        }
      }
    }
  }

  return count;
}

function applyNakedPairs(grid: number[], cands: Set<number>[]): number {
  let count = 0;
  for (const unit of [...ROWS, ...COLS, ...BOXES]) {
    const pairs = unit.filter((i) => grid[i] === 0 && cands[i].size === 2);
    for (let a = 0; a < pairs.length; a++) {
      for (let b = a + 1; b < pairs.length; b++) {
        const ia = pairs[a];
        const ib = pairs[b];
        if ([...cands[ia]].every((d) => cands[ib].has(d))) {
          for (const ic of unit) {
            if (ic === ia || ic === ib) continue;
            for (const d of cands[ia]) {
              if (cands[ic].has(d)) {
                cands[ic].delete(d);
                count++;
              }
            }
          }
        }
      }
    }
  }
  return count;
}

function applyHiddenPairs(grid: number[], cands: Set<number>[]): number {
  let count = 0;
  for (const unit of [...ROWS, ...COLS, ...BOXES]) {
    for (let d1 = 1; d1 <= 9; d1++) {
      for (let d2 = d1 + 1; d2 <= 9; d2++) {
        const c1 = unit.filter((i) => grid[i] === 0 && cands[i].has(d1));
        const c2 = unit.filter((i) => grid[i] === 0 && cands[i].has(d2));
        if (c1.length === 2 && c2.length === 2 && c1[0] === c2[0] && c1[1] === c2[1]) {
          for (const ic of c1) {
            for (let d = 1; d <= 9; d++) {
              if (d !== d1 && d !== d2 && cands[ic].has(d)) {
                cands[ic].delete(d);
                count++;
              }
            }
          }
        }
      }
    }
  }
  return count;
}

function applyNakedTriples(grid: number[], cands: Set<number>[]): number {
  let count = 0;
  for (const unit of [...ROWS, ...COLS, ...BOXES]) {
    const eligible = unit.filter((i) => grid[i] === 0 && cands[i].size >= 2 && cands[i].size <= 3);
    for (let a = 0; a < eligible.length; a++) {
      for (let b = a + 1; b < eligible.length; b++) {
        for (let c = b + 1; c < eligible.length; c++) {
          const union = new Set([
            ...cands[eligible[a]],
            ...cands[eligible[b]],
            ...cands[eligible[c]],
          ]);
          if (union.size === 3) {
            for (const ic of unit) {
              if (ic === eligible[a] || ic === eligible[b] || ic === eligible[c]) continue;
              for (const d of union) {
                if (cands[ic].has(d)) {
                  cands[ic].delete(d);
                  count++;
                }
              }
            }
          }
        }
      }
    }
  }
  return count;
}

function applyHiddenTriples(grid: number[], cands: Set<number>[]): number {
  let count = 0;
  for (const unit of [...ROWS, ...COLS, ...BOXES]) {
    for (let d1 = 1; d1 <= 9; d1++) {
      for (let d2 = d1 + 1; d2 <= 9; d2++) {
        for (let d3 = d2 + 1; d3 <= 9; d3++) {
          const cells = unit.filter(
            (i) => grid[i] === 0 && (cands[i].has(d1) || cands[i].has(d2) || cands[i].has(d3)),
          );
          if (cells.length === 3) {
            for (const ic of cells) {
              for (let d = 1; d <= 9; d++) {
                if (d !== d1 && d !== d2 && d !== d3 && cands[ic].has(d)) {
                  cands[ic].delete(d);
                  count++;
                }
              }
            }
          }
        }
      }
    }
  }
  return count;
}

function applyXWing(grid: number[], cands: Set<number>[]): number {
  let count = 0;
  for (let d = 1; d <= 9; d++) {
    for (let r1 = 0; r1 < 9; r1++) {
      const row1 = ROWS[r1].filter((i) => grid[i] === 0 && cands[i].has(d));
      if (row1.length !== 2) continue;
      const [c1, c2] = row1.map((i) => i % 9);
      for (let r2 = r1 + 1; r2 < 9; r2++) {
        const row2 = ROWS[r2].filter((i) => grid[i] === 0 && cands[i].has(d));
        if (row2.length !== 2) continue;
        const [rc1, rc2] = row2.map((i) => i % 9);
        if (c1 === rc1 && c2 === rc2) {
          for (let r = 0; r < 9; r++) {
            if (r === r1 || r === r2) continue;
            for (const col of [c1, c2]) {
              if (cands[r * 9 + col].has(d)) {
                cands[r * 9 + col].delete(d);
                count++;
              }
            }
          }
        }
      }
    }
  }
  return count;
}

function applySwordfish(grid: number[], cands: Set<number>[]): number {
  let count = 0;
  for (let d = 1; d <= 9; d++) {
    for (let r1 = 0; r1 < 9; r1++) {
      const row1 = ROWS[r1].filter((i) => grid[i] === 0 && cands[i].has(d));
      if (row1.length < 2 || row1.length > 3) continue;
      for (let r2 = r1 + 1; r2 < 9; r2++) {
        const row2 = ROWS[r2].filter((i) => grid[i] === 0 && cands[i].has(d));
        if (row2.length < 2 || row2.length > 3) continue;
        for (let r3 = r2 + 1; r3 < 9; r3++) {
          const row3 = ROWS[r3].filter((i) => grid[i] === 0 && cands[i].has(d));
          if (row3.length < 2 || row3.length > 3) continue;
          const cols = new Set([...row1, ...row2, ...row3].map((i) => i % 9));
          if (cols.size === 3) {
            for (let r = 0; r < 9; r++) {
              if (r === r1 || r === r2 || r === r3) continue;
              for (const c of cols) {
                if (cands[r * 9 + c].has(d)) {
                  cands[r * 9 + c].delete(d);
                  count++;
                }
              }
            }
          }
        }
      }
    }
  }
  return count;
}

// Backtracking solver used only to determine the correct value during chain step.
function backtrackSolve(grid: number[]): boolean {
  const empty = grid.indexOf(0);
  if (empty === -1) return true;
  const row = Math.floor(empty / 9);
  const col = empty % 9;
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let v = 1; v <= 9; v++) {
    let ok = true;
    for (let i = 0; i < 9 && ok; i++) {
      if (grid[row * 9 + i] === v) ok = false;
      if (grid[i * 9 + col] === v) ok = false;
      if (grid[(br + Math.floor(i / 3)) * 9 + bc + (i % 3)] === v) ok = false;
    }
    if (ok) {
      grid[empty] = v;
      if (backtrackSolve(grid)) return true;
      grid[empty] = 0;
    }
  }
  return false;
}

// Picks the cell with fewest candidates and uses backtracking to confirm the correct value.
// Represents one trial-and-error inference (chain step).
function applyChain(grid: number[], cands: Set<number>[]): boolean {
  let minIdx = -1;
  let minSize = 10;
  for (let i = 0; i < 81; i++) {
    if (grid[i] === 0 && cands[i].size > 1 && cands[i].size < minSize) {
      minSize = cands[i].size;
      minIdx = i;
    }
  }
  if (minIdx === -1) return false;

  const solution = [...grid];
  if (!backtrackSolve(solution)) return false;

  placeValue(grid, cands, minIdx, solution[minIdx]);
  return true;
}

// ── Public API ──────────────────────────────────────────────────────────────

export function scorePuzzle(gridStr: string): PuzzleScore {
  const grid = gridStr.split("").map(Number);
  const cands = initCandidates(grid);
  const techniques: TechniqueApplication[] = [];
  let score = 0;
  let maxWeight = 0;

  function record(name: string, count: number): void {
    const w = WEIGHTS[name];
    score += count * w;
    if (w > maxWeight) maxWeight = w;
    techniques.push({ name, weight: w });
  }

  const steps: Array<{ name: string; fn: () => number }> = [
    { name: "nakedSingle", fn: () => applyNakedSingles(grid, cands) },
    { name: "hiddenSingle", fn: () => applyHiddenSingles(grid, cands) },
    { name: "pointingPair", fn: () => applyPointingPairs(grid, cands) },
    { name: "nakedPair", fn: () => applyNakedPairs(grid, cands) },
    { name: "hiddenPair", fn: () => applyHiddenPairs(grid, cands) },
    { name: "nakedTriple", fn: () => applyNakedTriples(grid, cands) },
    { name: "hiddenTriple", fn: () => applyHiddenTriples(grid, cands) },
    { name: "xWing", fn: () => applyXWing(grid, cands) },
    { name: "swordfish", fn: () => applySwordfish(grid, cands) },
  ];

  const isSolved = () => grid.every((v) => v !== 0);
  const hasContradiction = () => cands.some((s, i) => grid[i] === 0 && s.size === 0);

  outer: while (!isSolved()) {
    if (hasContradiction()) break;

    for (const { name, fn } of steps) {
      const count = fn();
      if (count > 0) {
        record(name, count);
        continue outer;
      }
    }

    if (applyChain(grid, cands)) {
      record("chain", 1);
    } else {
      break;
    }
  }

  return { tier: tierFromMaxWeight(maxWeight), score, techniques };
}
