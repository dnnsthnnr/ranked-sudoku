import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// ─── Control Plane ────────────────────────────────────────────────────────────
// Global, single Turso DB. Small tables, globally queried. All FK constraints
// within this plane are enforced. References from the user plane are logical IDs.

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

// Matchmaking pool — fed by user-plane completions, queried globally for all players.
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

// Async-maintained leaderboard caches — written by background jobs, never in request path.
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

// Routes each player_id to the libsql URL of their user-data pool DB.
export const userDbRegistry = sqliteTable("user_db_registry", {
  playerId: text("player_id").primaryKey(),
  dbUrl: text("db_url").notNull(),
  poolId: text("pool_id"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});
