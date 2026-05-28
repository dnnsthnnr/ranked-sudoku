import { type ReplayMove } from "@/lib/replay";
import { getReplayStore } from "@/lib/replay-store";
import { randomUUID } from "node:crypto";

interface SubmitBody {
  ghostRunId: string;
  puzzleId: string;
  moves: ReplayMove[];
  effectiveTime: number;
  solvedAt: number;
  mistakes: number;
  outcome: "win" | "loss" | "forfeit";
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

  // TODO: create Race DB record + update player ELO once auth is wired

  return Response.json({ ok: true, outcome: body.outcome, replayKey: key });
}
