ALTER TABLE `users` MODIFY COLUMN `status` varchar(20) NOT NULL DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `organizations` DROP COLUMN `contact`;