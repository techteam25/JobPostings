CREATE TABLE `job_alert_matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`job_alert_id` int NOT NULL,
	`job_id` int NOT NULL,
	`match_score` float NOT NULL,
	`was_sent` boolean NOT NULL DEFAULT false,
	`matched_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `job_alert_matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `job_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`state` varchar(255),
	`city` varchar(255),
	`search_query` text,
	`job_type` json,
	`skills` json,
	`experience_level` json,
	`is_active` boolean NOT NULL DEFAULT true,
	`is_paused` boolean NOT NULL DEFAULT false,
	`include_remote` boolean NOT NULL DEFAULT true,
	`frequency` enum('daily','weekly','monthly') NOT NULL DEFAULT 'weekly',
	`last_sent_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `job_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `job_alert_matches` ADD CONSTRAINT `job_alert_matches_job_alert_id_job_alerts_id_fk` FOREIGN KEY (`job_alert_id`) REFERENCES `job_alerts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_alert_matches` ADD CONSTRAINT `job_alert_matches_job_id_job_details_id_fk` FOREIGN KEY (`job_id`) REFERENCES `job_details`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_alerts` ADD CONSTRAINT `job_alerts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `job_alert_matches_job_alert_id_idx` ON `job_alert_matches` (`job_alert_id`);--> statement-breakpoint
CREATE INDEX `job_alert_matches_job_id_idx` ON `job_alert_matches` (`job_id`);--> statement-breakpoint
CREATE INDEX `job_alert_matches_was_sent_idx` ON `job_alert_matches` (`was_sent`);--> statement-breakpoint
CREATE INDEX `job_alert_matches_job_alert_id_was_sent_idx` ON `job_alert_matches` (`job_alert_id`,`was_sent`);--> statement-breakpoint
CREATE INDEX `job_alerts_user_id_idx` ON `job_alerts` (`user_id`);--> statement-breakpoint
CREATE INDEX `job_alerts_is_active_idx` ON `job_alerts` (`is_active`);--> statement-breakpoint
CREATE INDEX `job_alerts_is_paused_idx` ON `job_alerts` (`is_paused`);--> statement-breakpoint
CREATE INDEX `job_alerts_frequency_idx` ON `job_alerts` (`frequency`);--> statement-breakpoint
CREATE INDEX `job_alerts_user_id_is_active_idx` ON `job_alerts` (`user_id`,`is_active`);