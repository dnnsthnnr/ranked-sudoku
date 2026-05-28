import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ─── User Data Plane ──────────────────────────────────────────────────────────
// Pooled Turso DBs (N instances). Append-only event tables that grow unboundedly.
// All references to control-plane tables (players, ghost_runs, puzzles,
// daily_games) are plain text IDs — no FK constraints enforced here.

export const rankedMatches = sqliteTable("ranked_matches", {
  id: text("id").primaryKey(),
  playerId: text("player_id").notNull(),
  ghostRunId: text("ghost_run_id").notNull(),
  opponentPlayerId: text("opponent_player_id"),
  puzzleId: text("puzzle_id").notNull(),
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
  dailyGameId: text("daily_game_id").notNull(),
  playerId: text("player_id").notNull(),
  effectiveTime: integer("effective_time").notNull(),
  mistakes: integer("mistakes").notNull().default(0),
  ghostRunId: text("ghost_run_id"),
  completedAt: text("completed_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});
