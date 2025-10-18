ALTER TABLE `users` ADD `status` enum('active','deactivated','deleted') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `deleted_at` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `deleted_status_requires_deleted_at` CHECK ((`users`.`status` != 'deleted' OR `users`.`deleted_at` IS NOT NULL));--> statement-breakpoint
CREATE INDEX `idx_users_status` ON `users` (`status`);--> statement-breakpoint
CREATE INDEX `idx_users_email` ON `users` (`email`);--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `is_active`;