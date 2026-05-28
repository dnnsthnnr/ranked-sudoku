/**
 * Computes the lead bar percentage (0–100) for display during a race.
 *
 * Compares the player's puzzle completion fraction to the fraction of the
 * ghost's total effective time that has elapsed. Scaled by 150 so that
 * meaningful time leads (e.g. 30 s on a 3:30 run) produce a clearly visible
 * bar shift rather than a barely-perceptible twitch near 50%.
 *
 * 50 % → dead heat
 * > 50 % → player ahead
 * < 50 % → ghost ahead
 */
export function computeLeadPct(
  playerFilledCount: number,
  totalCells: number,
  elapsedMs: number,
  mistakeCount: number,
  ghostEffectiveTime: number,
): number {
  if (ghostEffectiveTime <= 0 || totalCells <= 0) return 50;
  const effectiveElapsedMs = elapsedMs + mistakeCount * 10_000;
  const ghostTimeFraction = Math.min(effectiveElapsedMs, ghostEffectiveTime) / ghostEffectiveTime;
  const playerFraction = playerFilledCount / totalCells;
  return Math.max(0, Math.min(100, 50 + (playerFraction - ghostTimeFraction) * 150));
}
