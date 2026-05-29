export interface DailyCompletion {
  id: string;
  dailyGameId: string;
  playerId: string;
  effectiveTime: number;
  mistakes: number;
  ghostRunId: string | null;
  completedAt: string;
}
