CREATE TABLE `daily_games` (
	`id` text PRIMARY KEY NOT NULL,
	`puzzle_id` text NOT NULL,
	`tier` text NOT NULL,
	`date` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`puzzle_id`) REFERENCES `puzzles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ghost_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`puzzle_id` text NOT NULL,
	`player_id` text NOT NULL,
	`stamped_elo` integer NOT NULL,
	`effective_time` integer NOT NULL,
	`replay_r2_key` text NOT NULL,
	`is_seed_run` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`puzzle_id`) REFERENCES `puzzles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`elo` integer DEFAULT 800 NOT NULL,
	`race_count` integer DEFAULT 0 NOT NULL,
	`skill_level` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `puzzles` (
	`id` text PRIMARY KEY NOT NULL,
	`grid` text NOT NULL,
	`solution` text NOT NULL,
	`difficulty_tier` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `races` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`ghost_run_id` text NOT NULL,
	`outcome` text NOT NULL,
	`effective_time` integer,
	`mistakes` integer DEFAULT 0 NOT NULL,
	`elo_before` integer NOT NULL,
	`elo_after` integer NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ghost_run_id`) REFERENCES `ghost_runs`(`id`) ON UPDATE no action ON DELETE no action
);
