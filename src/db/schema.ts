import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const puzzles = sqliteTable("puzzles", {
  id: text("id").primaryKey(),
  grid: text("grid").notNull(),
  solution: text("solution").notNull(),
  difficultyTier: text("difficulty_tier", {
    enum: ["easy", "medium", "hard"],
  }).notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const players = sqliteTable("players", {
  id: text("id").primaryKey(),
  displayName: text("display_name"),
  elo: integer("elo").notNull().default(800),
  raceCount: integer("race_count").notNull().default(0),
  skillLevel: text("skill_level", {
    enum: ["no_experience", "beginner", "intermediate", "experienced"],
  }).notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const dailyGames = sqliteTable("daily_games", {
  id: text("id").primaryKey(),
  puzzleId: text("puzzle_id")
    .notNull()
    .references(() => puzzles.id),
  tier: text("tier", { enum: ["easy", "medium", "hard"] }).notNull(),
  date: text("date").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const ghostRuns = sqliteTable("ghost_runs", {
  id: text("id").primaryKey(),
  puzzleId: text("puzzle_id")
    .notNull()
    .references(() => puzzles.id),
  playerId: text("player_id")
    .notNull()
    .references(() => players.id),
  stampedElo: integer("stamped_elo").notNull(),
  effectiveTime: integer("effective_time").notNull(),
  replayKey: text("replay_key").notNull(),
  source: text("source", {
    enum: ["daily", "ranked", "seed"],
  }).notNull(),
  isActiveInPool: integer("is_active_in_pool", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const rankedMatches = sqliteTable("ranked_matches", {
  id: text("id").primaryKey(),
  playerId: text("player_id")
    .notNull()
    .references(() => players.id),
  ghostRunId: text("ghost_run_id")
    .notNull()
    .references(() => ghostRuns.id),
  opponentPlayerId: text("opponent_player_id").references(() => players.id),
  puzzleId: text("puzzle_id")
    .notNull()
    .references(() => puzzles.id),
  matchType: text("match_type", {
    enum: ["ranked", "ghost_match", "live_match"],
  })
    .notNull()
    .default("ranked"),
  outcome: text("outcome", { enum: ["win", "loss", "forfeit"] }).notNull(),
  effectiveTime: integer("effective_time"),
  mistakes: integer("mistakes").notNull().default(0),
  eloBefore: integer("elo_before").notNull(),
  eloAfter: integer("elo_after").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const dailyCompletions = sqliteTable("daily_completions", {
  id: text("id").primaryKey(),
  dailyGameId: text("daily_game_id")
    .notNull()
    .references(() => dailyGames.id),
  playerId: text("player_id")
    .notNull()
    .references(() => players.id),
  effectiveTime: integer("effective_time").notNull(),
  mistakes: integer("mistakes").notNull().default(0),
  ghostRunId: text("ghost_run_id").references(() => ghostRuns.id),
  completedAt: text("completed_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const dailyLeaderboard = sqliteTable("daily_leaderboard", {
  id: text("id").primaryKey(),
  dailyGameId: text("daily_game_id")
    .notNull()
    .references(() => dailyGames.id),
  playerId: text("player_id")
    .notNull()
    .references(() => players.id),
  displayName: text("display_name"),
  effectiveTime: integer("effective_time").notNull(),
  mistakes: integer("mistakes").notNull().default(0),
  rank: integer("rank").notNull(),
  computedAt: text("computed_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const rankedLeaderboard = sqliteTable("ranked_leaderboard", {
  playerId: text("player_id")
    .primaryKey()
    .references(() => players.id),
  displayName: text("display_name"),
  elo: integer("elo").notNull(),
  raceCount: integer("race_count").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  forfeits: integer("forfeits").notNull().default(0),
  rank: integer("rank").notNull(),
  computedAt: text("computed_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});
