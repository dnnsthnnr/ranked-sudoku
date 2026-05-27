import { dailyGameRepository, ghostRunRepository, puzzleRepository } from "@/repositories";
import { getReplayStore } from "@/lib/replay";
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

  const [puzzle, ghostRun] = await Promise.all([
    puzzleRepository.findById(dailyGame.puzzleId),
    ghostRunRepository.findByPuzzleId(dailyGame.puzzleId),
  ]);

  if (!puzzle || !ghostRun) {
    return Response.json({ error: "Puzzle data incomplete" }, { status: 404 });
  }

  const replay = await getReplayStore().get(ghostRun.replayR2Key);
  if (!replay) {
    return Response.json({ error: "Replay data not found" }, { status: 404 });
  }

  // NOTE: solution is returned here for client-side validation — POC only, no auth yet
  return Response.json({
    puzzle: { id: puzzle.id, grid: puzzle.grid, solution: puzzle.solution },
    ghostRun: {
      id: ghostRun.id,
      effectiveTime: ghostRun.effectiveTime,
      stampedElo: ghostRun.stampedElo,
    },
    replay,
  });
}
