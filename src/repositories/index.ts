import { db } from "@/db/client";
import { DrizzlePuzzleRepository } from "./drizzle/puzzle.repository";
import { DrizzlePlayerRepository } from "./drizzle/player.repository";
import { DrizzleGhostRunRepository } from "./drizzle/ghost-run.repository";
import { DrizzleRaceRepository } from "./drizzle/race.repository";
import { DrizzleDailyGameRepository } from "./drizzle/daily-game.repository";

export const puzzleRepository = new DrizzlePuzzleRepository(db);
export const playerRepository = new DrizzlePlayerRepository(db);
export const ghostRunRepository = new DrizzleGhostRunRepository(db);
export const raceRepository = new DrizzleRaceRepository(db);
export const dailyGameRepository = new DrizzleDailyGameRepository(db);
