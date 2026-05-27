import type { ReplayData } from "@/lib/replay";

interface OpponentProgressProps {
  replay: ReplayData;
  totalCells: number; // total empty (non-given) cells
  elapsedMs: number;
  playerFilledCount: number;
}

function ProgressBar({ pct, label, done }: { pct: number; label: string; done: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs font-medium">
        <span>{label}</span>
        <span>{done ? "Finished ✓" : `${Math.round(pct)}%`}</span>
      </div>
      <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(done ? 100 : pct, 100)}%`,
            backgroundColor: label === "You" ? "#3b82f6" : "#f97316",
          }}
        />
      </div>
    </div>
  );
}

export function OpponentProgress({
  replay,
  totalCells,
  elapsedMs,
  playerFilledCount,
}: OpponentProgressProps) {
  const ghostFilled = replay.moves.filter((m) => !m.isMistake && m.timestamp <= elapsedMs).length;
  const ghostDone = elapsedMs >= replay.solvedAt;

  const playerPct = totalCells > 0 ? (playerFilledCount / totalCells) * 100 : 0;
  const ghostPct = totalCells > 0 ? (ghostFilled / totalCells) * 100 : 0;

  return (
    <div className="w-full max-w-xs flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Race Progress</h3>
      <ProgressBar pct={playerPct} label="You" done={playerFilledCount >= totalCells} />
      <ProgressBar pct={ghostPct} label="Opponent" done={ghostDone} />
      <p className="text-xs text-gray-400 text-right">
        Opponent target: {Math.floor(replay.effectiveTime / 60000)}m{" "}
        {Math.round((replay.effectiveTime % 60000) / 1000)}s
      </p>
    </div>
  );
}
