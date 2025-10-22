CREATE TABLE `organization_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`organization_id` int NOT NULL,
	`role` enum('owner','admin','recruiter','member') NOT NULL DEFAULT 'member',
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organization_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_user_org` UNIQUE(`user_id`,`organization_id`)
);
--> statement-breakpoint
CREATE TABLE `account` (
	`id` int AUTO_INCREMENT NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` int NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` timestamp(3),
	`refresh_token_expires_at` timestamp(3),
	`scope` text,
	`password` text,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL,
	CONSTRAINT `account_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` int AUTO_INCREMENT NOT NULL,
	`expires_at` timestamp(3) NOT NULL,
	`token` varchar(255) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` int NOT NULL,
	CONSTRAINT `session_id` PRIMARY KEY(`id`),
	CONSTRAINT `session_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` int AUTO_INCREMENT NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` timestamp(3) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `verification_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `auth`;--> statement-breakpoint
DROP TABLE `sessions`;--> statement-breakpoint
ALTER TABLE `users` DROP CONSTRAINT `employer_must_have_organization`;--> statement-breakpoint
ALTER TABLE `users` DROP FOREIGN KEY `users_organization_id_organizations_id_fk`;
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `status` varchar(20) NOT NULL DEFAULT ('active');--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `deleted_at` timestamp(3);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `last_login_at` timestamp(3);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `created_at` timestamp(3) NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `updated_at` timestamp(3) NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `user_profile` ADD `is_profile_public` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `user_profile` ADD `is_available_for_work` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `full_name` text NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `email_verified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `image` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `logo_url` varchar(500);--> statement-breakpoint
ALTER TABLE `organizations` ADD `subscription_tier` enum('free','basic','professional','enterprise') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `organizations` ADD `subscription_status` enum('active','cancelled','expired','trial') DEFAULT 'trial' NOT NULL;--> statement-breakpoint
ALTER TABLE `organizations` ADD `subscription_start_date` timestamp;--> statement-breakpoint
ALTER TABLE `organizations` ADD `subscription_end_date` timestamp;--> statement-breakpoint
ALTER TABLE `organizations` ADD `job_posting_limit` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `organizations` ADD `status` enum('active','suspended','deleted') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `user_profile` ADD CONSTRAINT `user_profile_user_id_unique` UNIQUE(`user_id`);--> statement-breakpoint
ALTER TABLE `organization_members` ADD CONSTRAINT `organization_members_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization_members` ADD CONSTRAINT `organization_members_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `account` ADD CONSTRAINT `account_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_org_members_user` ON `organization_members` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_org_members_org` ON `organization_members` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_session_user_id` ON `account` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_session_user_id` ON `session` (`user_id`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `status_must_be_valid` CHECK (`users`.`status` IN ("active", "deactivated", "deleted"));--> statement-breakpoint
CREATE INDEX `idx_subscription_status` ON `organizations` (`subscription_status`);--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `first_name`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `last_name`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `password_hash`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `role`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `organization_id`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `is_email_verified`;