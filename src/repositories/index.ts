import { controlDb, userDb } from "@/db/client";
import { DrizzlePuzzleRepository } from "./drizzle/puzzle.repository";
import { DrizzlePlayerRepository } from "./drizzle/player.repository";
import { DrizzleGhostRunRepository } from "./drizzle/ghost-run.repository";
import { DrizzleRankedMatchRepository } from "./drizzle/ranked-match.repository";
import { DrizzleDailyGameRepository } from "./drizzle/daily-game.repository";
import { DrizzleDailyCompletionRepository } from "./drizzle/daily-completion.repository";
import { DrizzleDailyLeaderboardRepository } from "./drizzle/daily-leaderboard.repository";
import { DrizzleRankedLeaderboardRepository } from "./drizzle/ranked-leaderboard.repository";
import { DrizzleUserDbRegistryRepository } from "./drizzle/user-db-registry.repository";

export const puzzleRepository = new DrizzlePuzzleRepository(controlDb);
export const playerRepository = new DrizzlePlayerRepository(controlDb);
export const ghostRunRepository = new DrizzleGhostRunRepository(controlDb, userDb);
export const dailyGameRepository = new DrizzleDailyGameRepository(controlDb);
export const rankedMatchRepository = new DrizzleRankedMatchRepository(userDb);
export const dailyCompletionRepository = new DrizzleDailyCompletionRepository(userDb);
export const dailyLeaderboardRepository = new DrizzleDailyLeaderboardRepository(controlDb, userDb);
export const rankedLeaderboardRepository = new DrizzleRankedLeaderboardRepository(
  controlDb,
  userDb,
);
export const userDbRegistryRepository = new DrizzleUserDbRegistryRepository(controlDb);
