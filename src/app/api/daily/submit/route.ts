import { type ReplayMove } from "@/lib/replay";
import { getReplayStore } from "@/lib/replay-store";
import { randomUUID } from "node:crypto";

interface SubmitBody {
  puzzleId: string;
  moves: ReplayMove[];
  effectiveTime: number;
  solvedAt: number;
  mistakes: number;
}

export async function POST(request: Request) {
  const body = (await request.json()) as SubmitBody;

  const key = randomUUID();
  await getReplayStore().put(key, {
    puzzleId: body.puzzleId,
    moves: body.moves,
    effectiveTime: body.effectiveTime,
    solvedAt: body.solvedAt,
  });

  // TODO: create GhostRun record (so this run can appear as a race opponent)

  return Response.json({ ok: true, replayKey: key });
}
