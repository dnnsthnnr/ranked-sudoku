PRAGMA foreign_keys=OFF;
--> statement-breakpoint

DROP TABLE `races`;
--> statement-breakpoint

CREATE TABLE `__new_ghost_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`puzzle_id` text NOT NULL,
	`player_id` text NOT NULL,
	`stamped_elo` integer NOT NULL,
	`effective_time` integer NOT NULL,
	`replay_key` text NOT NULL,
	`source` text NOT NULL,
	`is_active_in_pool` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`puzzle_id`) REFERENCES `puzzles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

INSERT INTO `__new_ghost_runs`
	SELECT
		`id`, `puzzle_id`, `player_id`, `stamped_elo`, `effective_time`,
		`replay_r2_key`,
		CASE WHEN `is_seed_run` = 1 THEN 'daily' ELSE 'ranked' END,
		1,
		`created_at`
	FROM `ghost_runs`;
--> statement-breakpoint

DROP TABLE `ghost_runs`;
--> statement-breakpoint

ALTER TABLE `__new_ghost_runs` RENAME TO `ghost_runs`;
--> statement-breakpoint

PRAGMA foreign_keys=ON;
--> statement-breakpoint

ALTER TABLE `players` ADD COLUMN `display_name` text;
--> statement-breakpoint

ALTER TABLE `players` ADD COLUMN `updated_at` text DEFAULT (datetime('now')) NOT NULL;
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
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ghost_run_id`) REFERENCES `ghost_runs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`opponent_player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`puzzle_id`) REFERENCES `puzzles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

CREATE TABLE `daily_completions` (
	`id` text PRIMARY KEY NOT NULL,
	`daily_game_id` text NOT NULL,
	`player_id` text NOT NULL,
	`effective_time` integer NOT NULL,
	`mistakes` integer DEFAULT 0 NOT NULL,
	`ghost_run_id` text,
	`completed_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`daily_game_id`) REFERENCES `daily_games`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ghost_run_id`) REFERENCES `ghost_runs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

CREATE TABLE `daily_leaderboard` (
	`id` text PRIMARY KEY NOT NULL,
	`daily_game_id` text NOT NULL,
	`player_id` text NOT NULL,
	`display_name` text,
	`effective_time` integer NOT NULL,
	`mistakes` integer DEFAULT 0 NOT NULL,
	`rank` integer NOT NULL,
	`computed_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`daily_game_id`) REFERENCES `daily_games`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint

CREATE TABLE `ranked_leaderboard` (
	`player_id` text PRIMARY KEY NOT NULL,
	`display_name` text,
	`elo` integer NOT NULL,
	`race_count` integer DEFAULT 0 NOT NULL,
	`wins` integer DEFAULT 0 NOT NULL,
	`losses` integer DEFAULT 0 NOT NULL,
	`forfeits` integer DEFAULT 0 NOT NULL,
	`rank` integer NOT NULL,
	`computed_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
