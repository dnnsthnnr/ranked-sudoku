interface TimerProps {
  elapsedMs: number;
  mistakeCount: number;
}

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function Timer({ elapsedMs, mistakeCount }: TimerProps) {
  return (
    <div className="flex items-center gap-4 text-sm font-mono">
      <span className="text-2xl font-bold tabular-nums">{formatTime(elapsedMs)}</span>
      {mistakeCount > 0 && (
        <span className="text-red-600 font-medium">
          +{mistakeCount * 10}s penalty ({mistakeCount}/3 mistakes)
        </span>
      )}
    </div>
  );
}
