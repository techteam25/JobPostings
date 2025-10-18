ALTER TABLE `sessions` MODIFY COLUMN `access_token` text;--> statement-breakpoint
# ALTER TABLE `job_insights` ADD `created_at` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
# ALTER TABLE `job_insights` ADD `updated_at` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;