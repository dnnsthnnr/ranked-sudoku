import { dailyGameRepository, puzzleRepository } from "@/repositories";
import type { DifficultyTier } from "@/domain/puzzle";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tier = (searchParams.get("tier") ?? "easy") as DifficultyTier;
  const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  const dailyGame = await dailyGameRepository.findByDate(date, tier);
  if (!dailyGame) {
    return Response.json(
      { error: "No daily puzzle found for this date and tier" },
      { status: 404 },
    );
  }

  const puzzle = await puzzleRepository.findById(dailyGame.puzzleId);
  if (!puzzle) {
    return Response.json({ error: "Puzzle data not found" }, { status: 404 });
  }

  // NOTE: solution is returned here for client-side validation — POC only, no auth yet
  return Response.json({
    puzzle: { id: puzzle.id, grid: puzzle.grid, solution: puzzle.solution },
  });
}
