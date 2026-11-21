CREATE TABLE `user_email_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`job_alerts` boolean NOT NULL DEFAULT true,
	`application_status` boolean NOT NULL DEFAULT true,
	`saved_job_updates` boolean NOT NULL DEFAULT true,
	`weekly_job_digest` boolean NOT NULL DEFAULT true,
	`monthly_newsletter` boolean NOT NULL DEFAULT true,
	`marketing_emails` boolean NOT NULL DEFAULT true,
	`account_security_alerts` boolean NOT NULL DEFAULT true,
	`unsubscribe_token` varchar(255) NOT NULL,
	`token_created_at` timestamp NOT NULL DEFAULT (now()),
	`token_expires_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_email_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_email_preferences_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
ALTER TABLE `user_email_preferences` ADD CONSTRAINT `user_email_preferences_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_user_email_preferences_user_id` ON `user_email_preferences` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_email_preferences_unsubscribe_token` ON `user_email_preferences` (`unsubscribe_token`);