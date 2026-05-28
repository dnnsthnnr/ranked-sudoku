import { db } from "@/db/client";
import { DrizzlePuzzleRepository } from "./drizzle/puzzle.repository";
import { DrizzlePlayerRepository } from "./drizzle/player.repository";
import { DrizzleGhostRunRepository } from "./drizzle/ghost-run.repository";
import { DrizzleRankedMatchRepository } from "./drizzle/ranked-match.repository";
import { DrizzleDailyGameRepository } from "./drizzle/daily-game.repository";
import { DrizzleDailyCompletionRepository } from "./drizzle/daily-completion.repository";
import { DrizzleDailyLeaderboardRepository } from "./drizzle/daily-leaderboard.repository";
import { DrizzleRankedLeaderboardRepository } from "./drizzle/ranked-leaderboard.repository";

export const puzzleRepository = new DrizzlePuzzleRepository(db);
export const playerRepository = new DrizzlePlayerRepository(db);
export const ghostRunRepository = new DrizzleGhostRunRepository(db);
export const rankedMatchRepository = new DrizzleRankedMatchRepository(db);
export const dailyGameRepository = new DrizzleDailyGameRepository(db);
export const dailyCompletionRepository = new DrizzleDailyCompletionRepository(db);
export const dailyLeaderboardRepository = new DrizzleDailyLeaderboardRepository(db);
export const rankedLeaderboardRepository = new DrizzleRankedLeaderboardRepository(db);
