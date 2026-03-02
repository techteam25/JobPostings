CREATE TABLE `saved_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`job_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saved_jobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_user_job` UNIQUE(`user_id`,`job_id`)
);
--> statement-breakpoint
ALTER TABLE `saved_jobs` ADD CONSTRAINT `saved_jobs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `saved_jobs` ADD CONSTRAINT `saved_jobs_job_id_job_details_id_fk` FOREIGN KEY (`job_id`) REFERENCES `job_details`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `user_idx` ON `saved_jobs` (`user_id`);--> statement-breakpoint
CREATE INDEX `job_idx` ON `saved_jobs` (`job_id`);