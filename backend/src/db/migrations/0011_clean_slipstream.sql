ALTER TABLE `sessions` DROP INDEX `sessions_refresh_token_unique`;--> statement-breakpoint
ALTER TABLE `sessions` MODIFY COLUMN `refresh_token` text;
