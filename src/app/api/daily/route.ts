import { dailyGameRepository, puzzleRepository } from "@/repositories";
import type { DifficultyTier } from "@/domain/puzzle";

const TIERS: DifficultyTier[] = ["easy", "medium", "hard"];

function pickTierForDate(date: string): DifficultyTier {
  // Deterministic daily assignment: hash the date string to one of the three tiers
  const hash = date.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return TIERS[hash % TIERS.length];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];
  const tier = pickTierForDate(date);

  const dailyGame = await dailyGameRepository.findByDate(date, tier);
  if (!dailyGame) {
    return Response.json({ error: "No daily puzzle found for this date" }, { status: 404 });
  }

  const puzzle = await puzzleRepository.findById(dailyGame.puzzleId);
  if (!puzzle) {
    return Response.json({ error: "Puzzle data not found" }, { status: 404 });
  }

  // NOTE: solution is returned here for client-side validation — POC only, no auth yet
  return Response.json({
    puzzle: { id: puzzle.id, grid: puzzle.grid, solution: puzzle.solution },
    tier,
  });
}
