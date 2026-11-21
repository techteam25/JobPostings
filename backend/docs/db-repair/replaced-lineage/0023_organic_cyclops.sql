ALTER TABLE `account` RENAME INDEX `idx_session_user_id` TO `idx_account_user_id`;--> statement-breakpoint
ALTER TABLE `job_details` MODIFY COLUMN `zipcode` varchar(20);--> statement-breakpoint
ALTER TABLE `job_alerts` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
CREATE INDEX `idx_session_expires_at` ON `session` (`expires_at`);