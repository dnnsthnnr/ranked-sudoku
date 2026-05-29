import { type ReplayMove } from "@/lib/replay";
import { getReplayStore } from "@/lib/replay-store";
import { ghostRunRepository, playerRepository } from "@/repositories";
import { randomUUID } from "node:crypto";

interface SubmitBody {
  playerId: string; // TODO: derive from auth session once auth is wired
  puzzleId: string;
  moves: ReplayMove[];
  effectiveTime: number;
  solvedAt: number;
  mistakes: number;
}

export async function POST(request: Request) {
  const body = (await request.json()) as SubmitBody;

  const player = await playerRepository.findById(body.playerId);
  if (!player) {
    return Response.json({ error: "Player not found" }, { status: 404 });
  }

  const replayKey = randomUUID();
  await getReplayStore().put(replayKey, {
    puzzleId: body.puzzleId,
    moves: body.moves,
    effectiveTime: body.effectiveTime,
    solvedAt: body.solvedAt,
  });

  // Daily completions produce a seed run eligible for matchmaking
  await ghostRunRepository.insert({
    id: randomUUID(),
    puzzleId: body.puzzleId,
    playerId: body.playerId,
    stampedElo: player.elo,
    effectiveTime: body.effectiveTime,
    replayKey,
    source: "daily",
    isActiveInPool: true,
  });

  return Response.json({ ok: true, replayKey });
}
