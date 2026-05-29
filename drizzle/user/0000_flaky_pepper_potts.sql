CREATE TABLE `daily_completions` (
	`id` text PRIMARY KEY NOT NULL,
	`daily_game_id` text NOT NULL,
	`player_id` text NOT NULL,
	`effective_time` integer NOT NULL,
	`mistakes` integer DEFAULT 0 NOT NULL,
	`ghost_run_id` text,
	`completed_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ranked_matches` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`ghost_run_id` text NOT NULL,
	`opponent_player_id` text,
	`puzzle_id` text NOT NULL,
	`match_type` text DEFAULT 'ranked' NOT NULL,
	`outcome` text NOT NULL,
	`effective_time` integer,
	`mistakes` integer DEFAULT 0 NOT NULL,
	`elo_before` integer NOT NULL,
	`elo_after` integer NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
