import { ghostRunRepository, puzzleRepository } from "@/repositories";
import { getReplayStore } from "@/lib/replay";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ghostRunId = searchParams.get("ghostRunId");

  if (!ghostRunId) {
    return Response.json({ error: "ghostRunId is required" }, { status: 400 });
  }

  const ghostRun = await ghostRunRepository.findById(ghostRunId);
  if (!ghostRun) {
    return Response.json({ error: "Ghost run not found" }, { status: 404 });
  }

  const [puzzle, replay] = await Promise.all([
    puzzleRepository.findById(ghostRun.puzzleId),
    getReplayStore().get(ghostRun.replayR2Key),
  ]);

  if (!puzzle || !replay) {
    return Response.json({ error: "Race data incomplete" }, { status: 404 });
  }

  // NOTE: solution returned for client-side validation — POC only, no auth yet
  return Response.json({
    ghostRun: {
      id: ghostRun.id,
      effectiveTime: ghostRun.effectiveTime,
      stampedElo: ghostRun.stampedElo,
    },
    puzzle: { id: puzzle.id, grid: puzzle.grid, solution: puzzle.solution },
    replay,
  });
}
