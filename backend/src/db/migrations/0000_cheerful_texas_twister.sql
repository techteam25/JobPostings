CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`user_email` varchar(255),
	`action` enum('auth.login','auth.logout','auth.register','auth.password_change','auth.password_reset','auth.email_verification','user.create','user.update','user.delete','user.deactivate','user.activate','user.profile_update','user.profile_visibility_change','organization.create','organization.update','organization.delete','organization.member_add','organization.member_remove','organization.member_role_change','job.create','job.update','job.delete','job.publish','job.unpublish','job.view','application.create','application.update','application.withdraw','application.status_change','application.view','saved_job.add','saved_job.remove','email_preferences.update','email_preferences.unsubscribe','email_preferences.resubscribe','file.upload','file.delete','file.view','admin.user_deactivate','admin.user_delete','admin.logs_view','system.error','system.warning') NOT NULL,
	`severity` enum('info','warning','error','critical') NOT NULL DEFAULT 'info',
	`resource_type` enum('user','user_profile','organization','organization_member','job','application','saved_job','email_preferences','file','session','account'),
	`resource_id` int,
	`resource_identifier` varchar(255),
	`ip_address` varchar(45),
	`user_agent` text,
	`session_id` varchar(255),
	`old_values` json,
	`new_values` json,
	`metadata` json,
	`description` text,
	`success` varchar(20) NOT NULL DEFAULT 'true',
	`error_message` text,
	`error_stack` text,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `certifications` (
	`id` int AUTO_INCREMENT NOT NULL,
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
	`id` int AUTO_INCREMENT NOT NULL,
	`user_profile_id` int NOT NULL,
	`school_name` varchar(100) NOT NULL,
	`program` enum('GED','High School Diploma','Associate Degree','Bachelors','Masters','Doctorate') NOT NULL,
	`major` varchar(100) NOT NULL,
	`graduated` boolean NOT NULL DEFAULT false,
	`start_date` timestamp NOT NULL,
	`end_date` timestamp,
	CONSTRAINT `educations_id` PRIMARY KEY(`id`),
	CONSTRAINT `graduated_end_date_check` CHECK((`educations`.`graduated` = false OR `educations`.`end_date` IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`full_name` text NOT NULL,
	`email` varchar(255) NOT NULL,
	`email_verified` boolean NOT NULL DEFAULT false,
	`image` text,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	`status` varchar(20) NOT NULL DEFAULT 'active',
	`deleted_at` timestamp(3),
	`last_login_at` timestamp(3),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `status_must_be_valid` CHECK((`users`.`status` IN ("active", "deactivated", "deleted"))),
	CONSTRAINT `deleted_status_requires_deleted_at` CHECK((`users`.`status` != 'deleted' OR `users`.`deleted_at` IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE `user_email_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`job_alerts` boolean NOT NULL DEFAULT true,
	`application_status` boolean NOT NULL DEFAULT true,
	`saved_job_updates` boolean NOT NULL DEFAULT true,
	`weekly_job_digest` boolean NOT NULL DEFAULT true,
	`monthly_newsletter` boolean NOT NULL DEFAULT true,
	`marketing_emails` boolean NOT NULL DEFAULT true,
	`account_security_alerts` boolean NOT NULL DEFAULT true,
	`unsubscribe_token` varchar(255) NOT NULL,
	`token_created_at` timestamp NOT NULL DEFAULT (now()),
	`unsubscribe_token_expires_at` timestamp,
	`global_unsubscribe` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_email_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_email_preferences_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `user_onboarding` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`intent` enum('seeker','employer') NOT NULL DEFAULT 'seeker',
	`status` enum('completed','pending') NOT NULL DEFAULT 'pending',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_onboarding_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_onboarding_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `user_profile` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`profile_picture` varchar(500),
	`bio` text,
	`resume_url` varchar(255),
	`linkedin_url` varchar(255),
	`portfolio_url` varchar(255),
	`phone_number` varchar(20),
	`address` varchar(255),
	`city` varchar(100),
	`state` varchar(100),
	`zip_code` varchar(10),
	`country` varchar(100) DEFAULT 'US',
	`is_profile_public` boolean NOT NULL DEFAULT true,
	`is_available_for_work` boolean NOT NULL DEFAULT true,
	`file_metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_profile_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_profile_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
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
CREATE TABLE `organizations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`street_address` varchar(100) NOT NULL,
	`city` varchar(100) NOT NULL,
	`state` varchar(100) NOT NULL,
	`country` varchar(100) NOT NULL,
	`zip_code` varchar(20) NOT NULL,
	`phone` varchar(50),
	`url` varchar(255) NOT NULL,
	`logo_url` varchar(500),
	`mission` text NOT NULL,
	`subscription_tier` enum('free','basic','professional','enterprise') NOT NULL DEFAULT 'free',
	`subscription_status` enum('active','cancelled','expired','trial') NOT NULL DEFAULT 'trial',
	`subscription_start_date` timestamp,
	`subscription_end_date` timestamp,
	`job_posting_limit` int DEFAULT 1,
	`status` enum('active','suspended','deleted') NOT NULL DEFAULT 'active',
	`file_metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `application_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`application_id` int NOT NULL,
	`user_id` int NOT NULL,
	`note` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `application_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `job_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`job_id` int NOT NULL,
	`applicant_id` int NOT NULL,
	`status` enum('pending','reviewed','shortlisted','interviewing','rejected','hired','withdrawn') NOT NULL DEFAULT 'pending',
	`cover_letter` text,
	`resume_url` varchar(500),
	`applied_at` timestamp NOT NULL DEFAULT (now()),
	`reviewed_at` timestamp,
	`notes` text,
	`file_metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `job_applications_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_applicant_job` UNIQUE(`job_id`,`applicant_id`)
);
--> statement-breakpoint
CREATE TABLE `job_insights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`job_id` int NOT NULL,
	`organization_id` int NOT NULL,
	`view_count` int DEFAULT 0,
	`application_count` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `job_insights_id` PRIMARY KEY(`id`),
	CONSTRAINT `application_count_must_be_gt_0` CHECK((`job_insights`.`application_count` >= 0))
);
--> statement-breakpoint
CREATE TABLE `job_skills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`job_id` int NOT NULL,
	`skill_id` int NOT NULL,
	`isRequired` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `job_skills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `job_details` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`city` varchar(255) NOT NULL,
	`state` varchar(50),
	`country` varchar(100) NOT NULL,
	`zipcode` int,
	`job_type` enum('full-time','part-time','contract','volunteer','internship') NOT NULL,
	`compensation_type` enum('paid','missionary','volunteer','stipend') NOT NULL,
	`is_remote` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	`application_deadline` timestamp,
	`experience` varchar(255),
	`employer_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `job_details_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saved_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`job_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saved_jobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_user_job` UNIQUE(`user_id`,`job_id`)
);
--> statement-breakpoint
CREATE TABLE `skills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `skills_id` PRIMARY KEY(`id`),
	CONSTRAINT `skills_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `work_experiences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_profile_id` int NOT NULL,
	`company_name` varchar(100) NOT NULL,
	`current` boolean NOT NULL DEFAULT false,
	`start_date` timestamp NOT NULL,
	`end_date` timestamp,
	CONSTRAINT `work_experiences_id` PRIMARY KEY(`id`),
	CONSTRAINT `resigned_end_date_check` CHECK((`work_experiences`.`current` = false OR `work_experiences`.`end_date` IS NOT NULL))
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
CREATE TABLE `subscriptions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`provider_id` varchar(100) NOT NULL,
	`plan_type` varchar(50) NOT NULL,
	`status` varchar(20) NOT NULL,
	`current_period_start` timestamp NOT NULL,
	`current_period_end` timestamp NOT NULL,
	`cancel_at_period_end` boolean NOT NULL DEFAULT false,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_certifications` ADD CONSTRAINT `user_certifications_user_id_user_profile_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user_profile`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_certifications` ADD CONSTRAINT `user_certifications_certification_id_certifications_id_fk` FOREIGN KEY (`certification_id`) REFERENCES `certifications`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `educations` ADD CONSTRAINT `educations_user_profile_id_user_profile_id_fk` FOREIGN KEY (`user_profile_id`) REFERENCES `user_profile`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_email_preferences` ADD CONSTRAINT `user_email_preferences_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_onboarding` ADD CONSTRAINT `user_onboarding_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_profile` ADD CONSTRAINT `user_profile_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization_members` ADD CONSTRAINT `organization_members_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization_members` ADD CONSTRAINT `organization_members_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `application_notes` ADD CONSTRAINT `fk_note_application` FOREIGN KEY (`application_id`) REFERENCES `job_applications`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `application_notes` ADD CONSTRAINT `fk_note_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_applications` ADD CONSTRAINT `fk_application_job` FOREIGN KEY (`job_id`) REFERENCES `job_details`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_applications` ADD CONSTRAINT `fk_application_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_insights` ADD CONSTRAINT `job_insights_job_id_job_details_id_fk` FOREIGN KEY (`job_id`) REFERENCES `job_details`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_insights` ADD CONSTRAINT `job_insights_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_skills` ADD CONSTRAINT `job_skills_job_id_job_details_id_fk` FOREIGN KEY (`job_id`) REFERENCES `job_details`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_skills` ADD CONSTRAINT `job_skills_skill_id_skills_id_fk` FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_details` ADD CONSTRAINT `fk_job_employer` FOREIGN KEY (`employer_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `saved_jobs` ADD CONSTRAINT `saved_jobs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `saved_jobs` ADD CONSTRAINT `saved_jobs_job_id_job_details_id_fk` FOREIGN KEY (`job_id`) REFERENCES `job_details`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `work_experiences` ADD CONSTRAINT `work_experiences_user_profile_id_user_profile_id_fk` FOREIGN KEY (`user_profile_id`) REFERENCES `user_profile`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `account` ADD CONSTRAINT `account_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_audit_logs_user_id` ON `audit_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_action` ON `audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_resource` ON `audit_logs` (`resource_type`,`resource_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_created_at` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_severity` ON `audit_logs` (`severity`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_session_id` ON `audit_logs` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_ip_address` ON `audit_logs` (`ip_address`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_user_action` ON `audit_logs` (`user_id`,`action`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_user_date` ON `audit_logs` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_resource_date` ON `audit_logs` (`resource_type`,`resource_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `program_idx` ON `educations` (`program`);--> statement-breakpoint
CREATE INDEX `major_idx` ON `educations` (`major`);--> statement-breakpoint
CREATE INDEX `idx_users_status` ON `users` (`status`);--> statement-breakpoint
CREATE INDEX `idx_users_email` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_user_email_preferences_user_id` ON `user_email_preferences` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_user_email_preferences_unsubscribe_token` ON `user_email_preferences` (`unsubscribe_token`);--> statement-breakpoint
CREATE INDEX `idx_user_profile_is_profile_public` ON `user_profile` (`is_profile_public`);--> statement-breakpoint
CREATE INDEX `idx_org_members_user` ON `organization_members` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_org_members_org` ON `organization_members` (`organization_id`);--> statement-breakpoint
CREATE INDEX `organization_name_idx` ON `organizations` (`name`);--> statement-breakpoint
CREATE INDEX `state_idx` ON `organizations` (`state`);--> statement-breakpoint
CREATE INDEX `city_idx` ON `organizations` (`city`);--> statement-breakpoint
CREATE INDEX `zip_idx` ON `organizations` (`zip_code`);--> statement-breakpoint
CREATE INDEX `idx_subscription_status` ON `organizations` (`subscription_status`);--> statement-breakpoint
CREATE INDEX `application_idx` ON `application_notes` (`application_id`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `application_notes` (`user_id`);--> statement-breakpoint
CREATE INDEX `job_idx` ON `job_applications` (`job_id`);--> statement-breakpoint
CREATE INDEX `applicant_idx` ON `job_applications` (`applicant_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `job_applications` (`status`);--> statement-breakpoint
CREATE INDEX `applied_date_idx` ON `job_applications` (`applied_at`);--> statement-breakpoint
CREATE INDEX `user_applications_idx` ON `job_applications` (`applicant_id`,`applied_at`);--> statement-breakpoint
CREATE INDEX `job_applications_idx` ON `job_applications` (`job_id`,`applied_at`);--> statement-breakpoint
CREATE INDEX `user_job_lookup_idx` ON `job_applications` (`job_id`,`applicant_id`);--> statement-breakpoint
CREATE INDEX `job_idx` ON `job_insights` (`job_id`);--> statement-breakpoint
CREATE INDEX `job_idx` ON `job_skills` (`job_id`);--> statement-breakpoint
CREATE INDEX `skill_idx` ON `job_skills` (`skill_id`);--> statement-breakpoint
CREATE INDEX `employer_idx` ON `job_details` (`employer_id`);--> statement-breakpoint
CREATE INDEX `job_type_idx` ON `job_details` (`job_type`);--> statement-breakpoint
CREATE INDEX `city_idx` ON `job_details` (`city`);--> statement-breakpoint
CREATE INDEX `state_idx` ON `job_details` (`state`);--> statement-breakpoint
CREATE INDEX `zipcode_idx` ON `job_details` (`zipcode`);--> statement-breakpoint
CREATE INDEX `is_remote_idx` ON `job_details` (`is_remote`);--> statement-breakpoint
CREATE INDEX `experience_idx` ON `job_details` (`experience`);--> statement-breakpoint
CREATE INDEX `is_active_idx` ON `job_details` (`is_active`);--> statement-breakpoint
CREATE INDEX `active_idx` ON `job_details` (`is_active`);--> statement-breakpoint
CREATE INDEX `deadline_idx` ON `job_details` (`application_deadline`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `job_details` (`created_at`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `saved_jobs` (`user_id`);--> statement-breakpoint
CREATE INDEX `job_idx` ON `saved_jobs` (`job_id`);--> statement-breakpoint
CREATE INDEX `skill_name_idx` ON `skills` (`name`);--> statement-breakpoint
CREATE INDEX `program_idx` ON `work_experiences` (`company_name`);--> statement-breakpoint
CREATE INDEX `idx_session_user_id` ON `account` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_session_user_id` ON `session` (`user_id`);--> statement-breakpoint
CREATE INDEX `organization_idx` ON `subscriptions` (`organization_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `subscriptions` (`status`);--> statement-breakpoint
CREATE INDEX `provider_idx` ON `subscriptions` (`provider_id`);