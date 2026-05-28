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
    <div className="flex items-center gap-3 text-sm font-mono">
      <span className="text-2xl font-bold tabular-nums">{formatTime(elapsedMs + mistakeCount * 10_000)}</span>
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`text-base font-bold leading-none select-none ${i < mistakeCount ? "text-red-500" : "text-gray-200"}`}
          >
            ✕
          </span>
        ))}
      </div>
    </div>
  );
}
