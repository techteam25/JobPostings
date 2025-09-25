CREATE TABLE `sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`refresh_token` varchar(255) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessions_refresh_token_unique` UNIQUE(`refresh_token`)
);
--> statement-breakpoint
ALTER TABLE `auth` RENAME COLUMN `token` TO `provider`;--> statement-breakpoint
ALTER TABLE `educations` DROP CONSTRAINT `graduated_end_date_check`;--> statement-breakpoint
ALTER TABLE `users` DROP CONSTRAINT `employer_must_have_organization`;--> statement-breakpoint
ALTER TABLE `work_experiences` DROP CONSTRAINT `current_end_date_check`;--> statement-breakpoint
ALTER TABLE `users` DROP FOREIGN KEY `users_organization_id_organizations_id_fk`;
--> statement-breakpoint
ALTER TABLE `auth` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `auth` MODIFY COLUMN `user_id` int;--> statement-breakpoint
ALTER TABLE `auth` MODIFY COLUMN `provider` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `auth` MODIFY COLUMN `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `auth` MODIFY COLUMN `updated_at` timestamp ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `certifications` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `educations` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `user_profile` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `job_applications` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `job_details` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `organizations` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `work_experiences` MODIFY COLUMN `id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `auth` ADD `provider_id` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `educations` ADD CONSTRAINT `graduated_end_date_check` CHECK ((`educations`.`graduated` = false OR `educations`.`end_date` IS NOT NULL));--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `employer_must_have_organization` CHECK ((`users`.`role` != 'employer' OR `users`.`organization_id` IS NOT NULL));--> statement-breakpoint
ALTER TABLE `work_experiences` ADD CONSTRAINT `resigned_end_date_check` CHECK ((`work_experiences`.`current` = false OR `work_experiences`.`end_date` IS NOT NULL));--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE restrict ON UPDATE no action;