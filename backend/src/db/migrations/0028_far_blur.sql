CREATE TABLE `job_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_profile_id` int NOT NULL,
	`job_types` json NOT NULL,
	`compensation_types` json NOT NULL,
	`volunteer_hours_per_week` enum('less_than_10_hours','10-20_hours','20-30_hours','30-40_hours','over_40_hours'),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `job_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `job_preferences_user_profile_id_unique` UNIQUE(`user_profile_id`)
);
--> statement-breakpoint
ALTER TABLE `job_preferences` ADD CONSTRAINT `job_preferences_user_profile_id_user_profile_id_fk` FOREIGN KEY (`user_profile_id`) REFERENCES `user_profile`(`id`) ON DELETE cascade ON UPDATE no action;