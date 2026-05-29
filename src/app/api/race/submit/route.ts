import { type ReplayMove } from "@/lib/replay";
import { getReplayStore } from "@/lib/replay-store";
import { ghostRunRepository, playerRepository, rankedMatchRepository } from "@/repositories";
import { computeEloChange } from "@/lib/elo";
import { replayKey as makeReplayKey } from "@/lib/uuid";
import { randomUUID } from "node:crypto";

interface SubmitBody {
  playerId: string; // TODO: derive from auth session once auth is wired
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

  const [player, ghostRun] = await Promise.all([
    playerRepository.findById(body.playerId),
    ghostRunRepository.findById(body.ghostRunId),
  ]);

  if (!player) {
    return Response.json({ error: "Player not found" }, { status: 404 });
  }
  if (!ghostRun) {
    return Response.json({ error: "Ghost run not found" }, { status: 404 });
  }

  const key = makeReplayKey(body.puzzleId, body.playerId, body.solvedAt);
  await getReplayStore().put(key, {
    puzzleId: body.puzzleId,
    moves: body.moves,
    effectiveTime: body.effectiveTime,
    solvedAt: body.solvedAt,
  });

  const eloChange = computeEloChange(
    player.elo,
    ghostRun.stampedElo,
    body.outcome,
    player.raceCount,
  );
  const newElo = player.elo + eloChange;
  const newRaceCount = player.raceCount + 1;

  await rankedMatchRepository.insert({
    id: randomUUID(),
    playerId: body.playerId,
    ghostRunId: body.ghostRunId,
    opponentPlayerId: ghostRun.playerId,
    puzzleId: body.puzzleId,
    matchType: "ranked",
    outcome: body.outcome,
    effectiveTime: body.outcome === "forfeit" ? null : body.effectiveTime,
    mistakes: body.mistakes,
    eloBefore: player.elo,
    eloAfter: newElo,
  });

  await playerRepository.updateElo(body.playerId, newElo, newRaceCount);

  // A winning run becomes an eligible ghost run for future matchmaking
  if (body.outcome === "win") {
    await ghostRunRepository.insert({
      id: randomUUID(),
      puzzleId: body.puzzleId,
      playerId: body.playerId,
      stampedElo: newElo,
      effectiveTime: body.effectiveTime,
      replayKey: key,
      source: "ranked",
      isActiveInPool: true,
    });
  }

  return Response.json({ ok: true, outcome: body.outcome, replayKey: key, eloChange, newElo });
}
