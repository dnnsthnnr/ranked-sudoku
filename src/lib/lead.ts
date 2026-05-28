/**
 * Computes the lead bar percentage (0–100) for display during a race.
 *
 * Compares the player's puzzle completion fraction to the ghost's completion
 * fraction at the same effective elapsed time. Scaled by 150 so that meaningful
 * leads (e.g. 30 s on a 3:30 run) produce a clearly visible bar shift.
 *
 * `ghostFilled` must be pre-computed via `countGhostFillsAt` from `@/lib/replay`,
 * which correctly accounts for the ghost's own mistake penalties when filtering
 * moves against the player's effective elapsed time.
 *
 * 50 % → dead heat  |  > 50 % → player ahead  |  < 50 % → ghost ahead
 */
export function computeLeadPct(
  playerFilledCount: number,
  totalCells: number,
  ghostFilled: number,
): number {
  if (totalCells <= 0) return 50;
  const playerFraction = playerFilledCount / totalCells;
  const ghostFraction = Math.min(ghostFilled, totalCells) / totalCells;
  return Math.max(0, Math.min(100, 50 + (playerFraction - ghostFraction) * 150));
}
