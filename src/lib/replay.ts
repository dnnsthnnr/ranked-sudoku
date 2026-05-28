/** Penalty added to a player's effective time for each mistake, in milliseconds. */
export const MISTAKE_PENALTY_MS = 10_000;

export interface ReplayMove {
  cellIndex: number; // 0-80, row-major (row*9+col)
  value: number; // 0=erase, 1-9=digit
  timestamp: number; // ms elapsed from puzzle start
  isMistake: boolean;
}

export interface ReplayData {
  puzzleId: string;
  moves: ReplayMove[];
  effectiveTime: number; // raw time + (mistakes * MISTAKE_PENALTY_MS)
  solvedAt: number; // raw elapsed ms at completion
}

/**
 * Returns the number of correct cells the ghost has filled by the time the
 * player's effective clock reaches `playerEffectiveMs`.
 *
 * Ghost moves carry raw timestamps. Each ghost mistake shifts all subsequent
 * effective timestamps forward by MISTAKE_PENALTY_MS (mirroring how a live
 * player's effective clock jumps on each mistake). Because effective timestamps
 * are monotonically increasing, a single forward pass with an early exit is
 * sufficient.
 */
export function countGhostFillsAt(moves: ReplayMove[], playerEffectiveMs: number): number {
  let ghostMistakes = 0;
  let filled = 0;
  for (const move of moves) {
    const effectiveTs = move.timestamp + ghostMistakes * MISTAKE_PENALTY_MS;
    if (effectiveTs > playerEffectiveMs) break;
    if (move.isMistake) {
      ghostMistakes++;
    } else {
      filled++;
    }
  }
  return filled;
}

/**
 * Derives the effective time for a completed replay from its move log alone.
 * effectiveTime = lastCorrectMove.timestamp + mistakes × MISTAKE_PENALTY_MS
 */
export function computeEffectiveTime(moves: ReplayMove[]): number {
  const mistakes = moves.filter((m) => m.isMistake).length;
  const lastCorrect = [...moves].findLast((m) => !m.isMistake);
  return (lastCorrect?.timestamp ?? 0) + mistakes * MISTAKE_PENALTY_MS;
}
