CREATE TABLE `daily_games` (
	`id` text PRIMARY KEY NOT NULL,
	`puzzle_id` text NOT NULL,
	`tier` text NOT NULL,
	`date` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`puzzle_id`) REFERENCES `puzzles`(`id`) ON UPDATE no action ON DELETE no action
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
CREATE TABLE `ghost_runs` (
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
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text,
	`elo` integer DEFAULT 800 NOT NULL,
	`race_count` integer DEFAULT 0 NOT NULL,
	`user_db` text NOT NULL,
	`skill_level` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_db`) REFERENCES `user_db_registry`(`id`) ON UPDATE no action ON DELETE no action
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
--> statement-breakpoint
CREATE TABLE `user_db_registry` (
	`id` text PRIMARY KEY NOT NULL,
	`db_url` text NOT NULL,
	`encrypted_token` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
