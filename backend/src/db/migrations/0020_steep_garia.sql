CREATE TABLE `email_preference_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`preference_type` varchar(100) NOT NULL,
	`context` enum('job_seeker','employer','global') NOT NULL,
	`previous_value` boolean,
	`new_value` boolean NOT NULL,
	`change_source` enum('account_settings','email_link') NOT NULL,
	`ip_address` varchar(45),
	`user_agent` text,
	`changed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_preference_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `user_email_preferences` ADD `matched_candidates` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `user_email_preferences` ADD `job_seeker_unsubscribed` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `user_email_preferences` ADD `employer_unsubscribed` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `email_preference_audit_log` ADD CONSTRAINT `email_preference_audit_log_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_audit_user_id` ON `email_preference_audit_log` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_preference_type` ON `email_preference_audit_log` (`preference_type`);--> statement-breakpoint
CREATE INDEX `idx_audit_context` ON `email_preference_audit_log` (`context`);--> statement-breakpoint
CREATE INDEX `idx_audit_changed_at` ON `email_preference_audit_log` (`changed_at`);
