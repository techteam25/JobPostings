CREATE TABLE `auth` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`token` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `auth_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `certifications` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`certification_name` varchar(100) NOT NULL,
	CONSTRAINT `certifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_certifications` (
	`user_id` int NOT NULL,
	`certification_id` int NOT NULL,
	CONSTRAINT `user_certifications_certification_id_user_id_pk` PRIMARY KEY(`certification_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `educations` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_profile_id` int NOT NULL,
	`school_name` varchar(100) NOT NULL,
	`program` enum('GED','High School Diploma','Associate Degree','Bachelors','Masters','Doctorate') NOT NULL,
	`major` varchar(100) NOT NULL,
	`graduated` boolean NOT NULL DEFAULT false,
	`start_date` timestamp NOT NULL,
	`end_date` timestamp,
	CONSTRAINT `educations_id` PRIMARY KEY(`id`),
	CONSTRAINT `graduated_end_date_check` CHECK(`educations`.`graduated` = false OR `educations`.`end_date` IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE `user_profile` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`profile_picture` varchar(500),
	`bio` text,
	`user_id` int,
	`resume_url` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_profile_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`first_name` varchar(100) NOT NULL,
	`last_name` varchar(100) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` enum('user','employer','admin') NOT NULL DEFAULT 'user',
	`organization_id` int,
	`is_email_verified` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `employer_must_have_organization` CHECK(`users`.`role` != 'employer' OR `users`.`organization_id` IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE `job_applications` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`job_id` int NOT NULL,
	`applicant_id` int NOT NULL,
	`status` enum('pending','reviewed','shortlisted','rejected','hired') NOT NULL DEFAULT 'pending',
	`cover_letter` text,
	`resume_url` varchar(500),
	`applied_at` timestamp NOT NULL DEFAULT (now()),
	`reviewed_at` timestamp,
	`notes` text,
	CONSTRAINT `job_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `job_details` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`location` varchar(255) NOT NULL,
	`job_type` enum('full-time','part-time','contract','volunteer','internship') NOT NULL,
	`experience_level` enum('entry','mid','senior','lead','executive') NOT NULL,
	`salary_min` decimal(10,2),
	`salary_max` decimal(10,2),
	`is_remote` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`application_deadline` timestamp,
	`required_skills` text,
	`employer_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `job_details_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`street_address` varchar(100) NOT NULL,
	`city` varchar(100) NOT NULL,
	`state` varchar(100) NOT NULL,
	`zip_code` varchar(5) NOT NULL,
	`phone` varchar(15),
	`contact` int NOT NULL,
	`url` varchar(255) NOT NULL,
	`mission` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `work_experiences` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user_profile_id` int NOT NULL,
	`company_name` varchar(100) NOT NULL,
	`current` boolean NOT NULL DEFAULT false,
	`start_date` timestamp NOT NULL,
	`end_date` timestamp,
	CONSTRAINT `work_experiences_id` PRIMARY KEY(`id`),
	CONSTRAINT `graduated_end_date_check` CHECK(`work_experiences`.`current` = false OR `work_experiences`.`end_date` IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE `auth` ADD CONSTRAINT `auth_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_certifications` ADD CONSTRAINT `user_certifications_user_id_user_profile_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user_profile`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_certifications` ADD CONSTRAINT `user_certifications_certification_id_certifications_id_fk` FOREIGN KEY (`certification_id`) REFERENCES `certifications`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `educations` ADD CONSTRAINT `educations_user_profile_id_user_profile_id_fk` FOREIGN KEY (`user_profile_id`) REFERENCES `user_profile`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_profile` ADD CONSTRAINT `user_profile_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_details` ADD CONSTRAINT `job_details_employer_id_organizations_id_fk` FOREIGN KEY (`employer_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `work_experiences` ADD CONSTRAINT `work_experiences_user_profile_id_user_profile_id_fk` FOREIGN KEY (`user_profile_id`) REFERENCES `user_profile`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `program_idx` ON `educations` (`program`);--> statement-breakpoint
CREATE INDEX `major_idx` ON `educations` (`major`);--> statement-breakpoint
CREATE INDEX `job_idx` ON `job_applications` (`job_id`);--> statement-breakpoint
CREATE INDEX `applicant_idx` ON `job_applications` (`applicant_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `job_applications` (`status`);--> statement-breakpoint
CREATE INDEX `employer_idx` ON `job_details` (`employer_id`);--> statement-breakpoint
CREATE INDEX `job_type_idx` ON `job_details` (`job_type`);--> statement-breakpoint
CREATE INDEX `location_idx` ON `job_details` (`location`);--> statement-breakpoint
CREATE INDEX `active_idx` ON `job_details` (`is_active`);--> statement-breakpoint
CREATE INDEX `organization_name_idx` ON `organizations` (`name`);--> statement-breakpoint
CREATE INDEX `state_idx` ON `organizations` (`state`);--> statement-breakpoint
CREATE INDEX `city_idx` ON `organizations` (`city`);--> statement-breakpoint
CREATE INDEX `zip_idx` ON `organizations` (`zip_code`);--> statement-breakpoint
CREATE INDEX `program_idx` ON `work_experiences` (`company_name`);