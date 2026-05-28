import { controlDb, createAllUserDbsResolver, createPlayerDbResolver } from "@/db/client";
import { DrizzlePuzzleRepository } from "./drizzle/puzzle.repository";
import { DrizzlePlayerRepository } from "./drizzle/player.repository";
import { DrizzleGhostRunRepository } from "./drizzle/ghost-run.repository";
import { DrizzleRankedMatchRepository } from "./drizzle/ranked-match.repository";
import { DrizzleDailyGameRepository } from "./drizzle/daily-game.repository";
import { DrizzleDailyCompletionRepository } from "./drizzle/daily-completion.repository";
import { DrizzleDailyLeaderboardRepository } from "./drizzle/daily-leaderboard.repository";
import { DrizzleRankedLeaderboardRepository } from "./drizzle/ranked-leaderboard.repository";
import { DrizzleUserDbRegistryRepository } from "./drizzle/user-db-registry.repository";

const getPlayerDb = createPlayerDbResolver(controlDb);
const getAllUserDbs = createAllUserDbsResolver(controlDb);

export const puzzleRepository = new DrizzlePuzzleRepository(controlDb);
export const playerRepository = new DrizzlePlayerRepository(controlDb);
export const ghostRunRepository = new DrizzleGhostRunRepository(controlDb, getPlayerDb);
export const dailyGameRepository = new DrizzleDailyGameRepository(controlDb);
export const rankedMatchRepository = new DrizzleRankedMatchRepository(getPlayerDb);
export const dailyCompletionRepository = new DrizzleDailyCompletionRepository(
  getPlayerDb,
  getAllUserDbs,
);
export const dailyLeaderboardRepository = new DrizzleDailyLeaderboardRepository(
  controlDb,
  getAllUserDbs,
);
export const rankedLeaderboardRepository = new DrizzleRankedLeaderboardRepository(
  controlDb,
  getAllUserDbs,
);
export const userDbRegistryRepository = new DrizzleUserDbRegistryRepository(controlDb);
