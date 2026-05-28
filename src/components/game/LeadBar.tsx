import type { ReplayData } from "@/lib/replay";
import { computeLeadPct } from "@/lib/lead";

interface LeadBarProps {
  replay: ReplayData;
  totalCells: number;
  elapsedMs: number;
  playerFilledCount: number;
  mistakeCount: number;
}

export function LeadBar({
  replay,
  totalCells,
  elapsedMs,
  playerFilledCount,
  mistakeCount,
}: LeadBarProps) {
  const leadPct = computeLeadPct(
    playerFilledCount,
    totalCells,
    elapsedMs,
    mistakeCount,
    replay.effectiveTime,
  );

  return (
    <div className="w-full max-w-xs flex flex-col gap-1">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-blue-500">You</span>
        <span className="text-orange-500">Opponent</span>
      </div>
      <div className="relative h-4 w-full rounded-full bg-orange-200 overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${leadPct}%` }}
        />
        {/* Centre axis marker */}
        <div className="absolute left-1/2 top-0 w-0.5 h-full bg-gray-600 z-10 -translate-x-1/2" />
      </div>
    </div>
  );
}
