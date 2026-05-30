import type { RaceOutcome } from "@/domain/ranked-match";

const PLACEMENT_RACES = 16;
const K_PLACEMENT = 32;
const K_STANDARD = 16;

export function expectedScore(playerElo: number, opponentElo: number): number {
  return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
}

export function computeEloChange(
  playerElo: number,
  opponentElo: number,
  outcome: RaceOutcome,
  raceCount: number,
): number {
  const k = raceCount < PLACEMENT_RACES ? K_PLACEMENT : K_STANDARD;
  const score = outcome === "win" ? 1 : 0;
  return Math.round(k * (score - expectedScore(playerElo, opponentElo)));
}
