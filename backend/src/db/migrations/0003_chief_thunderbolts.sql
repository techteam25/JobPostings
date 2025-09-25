ALTER TABLE `user_profile` DROP FOREIGN KEY `user_profile_user_id_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `users` DROP FOREIGN KEY `users_organization_id_organizations_id_fk`;
--> statement-breakpoint
ALTER TABLE `job_details` DROP FOREIGN KEY `job_details_employer_id_organizations_id_fk`;
--> statement-breakpoint
ALTER TABLE `sessions` DROP FOREIGN KEY `sessions_user_id_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `user_profile` MODIFY COLUMN `user_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `user_profile` MODIFY COLUMN `resume_url` varchar(255);--> statement-breakpoint
ALTER TABLE `job_applications` MODIFY COLUMN `status` enum('pending','reviewed','shortlisted','interviewing','rejected','hired','withdrawn') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `job_details` MODIFY COLUMN `job_type` enum('full-time','part-time','contract','volunteer','internship','short-term-trip') NOT NULL;--> statement-breakpoint
ALTER TABLE `job_details` MODIFY COLUMN `salary_min` decimal(12,2);--> statement-breakpoint
ALTER TABLE `job_details` MODIFY COLUMN `salary_max` decimal(12,2);--> statement-breakpoint
ALTER TABLE `sessions` MODIFY COLUMN `refresh_token` varchar(512) NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` MODIFY COLUMN `created_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `user_profile` ADD `linkedin_url` varchar(255);--> statement-breakpoint
ALTER TABLE `user_profile` ADD `portfolio_url` varchar(255);--> statement-breakpoint
ALTER TABLE `user_profile` ADD `phone_number` varchar(20);--> statement-breakpoint
ALTER TABLE `user_profile` ADD `address` varchar(255);--> statement-breakpoint
ALTER TABLE `user_profile` ADD `city` varchar(100);--> statement-breakpoint
ALTER TABLE `user_profile` ADD `state` varchar(100);--> statement-breakpoint
ALTER TABLE `user_profile` ADD `zip_code` varchar(10);--> statement-breakpoint
ALTER TABLE `user_profile` ADD `country` varchar(100) DEFAULT 'US';--> statement-breakpoint
ALTER TABLE `users` ADD `last_login_at` timestamp;--> statement-breakpoint
ALTER TABLE `job_applications` ADD `custom_answers` text;--> statement-breakpoint
ALTER TABLE `job_applications` ADD `reviewed_by` int;--> statement-breakpoint
ALTER TABLE `job_applications` ADD `rating` int;--> statement-breakpoint
ALTER TABLE `job_applications` ADD `created_at` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `job_applications` ADD `updated_at` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `job_details` ADD `compensation_type` enum('paid','missionary','volunteer','stipend') NOT NULL;--> statement-breakpoint
ALTER TABLE `job_details` ADD `currency` varchar(3) DEFAULT 'USD';--> statement-breakpoint
ALTER TABLE `job_details` ADD `preferred_skills` text;--> statement-breakpoint
ALTER TABLE `job_details` ADD `benefits` text;--> statement-breakpoint
ALTER TABLE `job_details` ADD `posted_by_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `job_details` ADD `view_count` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `job_details` ADD `application_count` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `access_token` varchar(512) NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `user_agent` varchar(500);--> statement-breakpoint
ALTER TABLE `sessions` ADD `ip_address` varchar(45);--> statement-breakpoint
ALTER TABLE `sessions` ADD `is_active` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `refresh_expires_at` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `last_used_at` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_access_token_unique` UNIQUE(`access_token`);--> statement-breakpoint
ALTER TABLE `job_applications` ADD CONSTRAINT `fk_application_job` FOREIGN KEY (`job_id`) REFERENCES `job_details`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_applications` ADD CONSTRAINT `fk_application_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_applications` ADD CONSTRAINT `fk_application_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_details` ADD CONSTRAINT `fk_job_employer` FOREIGN KEY (`employer_id`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_details` ADD CONSTRAINT `fk_job_poster` FOREIGN KEY (`posted_by_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `applied_date_idx` ON `job_applications` (`applied_at`);--> statement-breakpoint
CREATE INDEX `posted_by_idx` ON `job_details` (`posted_by_id`);--> statement-breakpoint
CREATE INDEX `deadline_idx` ON `job_details` (`application_deadline`);