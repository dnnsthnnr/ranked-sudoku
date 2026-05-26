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

export const players = sqliteTable("players", {
  id: text("id").primaryKey(),
  elo: integer("elo").notNull().default(800),
  raceCount: integer("race_count").notNull().default(0),
  skillLevel: text("skill_level", {
    enum: ["no_experience", "beginner", "intermediate", "experienced"],
  }).notNull(),
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
  replayR2Key: text("replay_r2_key").notNull(),
  isSeedRun: integer("is_seed_run", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const races = sqliteTable("races", {
  id: text("id").primaryKey(),
  playerId: text("player_id")
    .notNull()
    .references(() => players.id),
  ghostRunId: text("ghost_run_id")
    .notNull()
    .references(() => ghostRuns.id),
  outcome: text("outcome", { enum: ["win", "loss", "forfeit"] }).notNull(),
  effectiveTime: integer("effective_time"),
  mistakes: integer("mistakes").notNull().default(0),
  eloBefore: integer("elo_before").notNull(),
  eloAfter: integer("elo_after").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});
