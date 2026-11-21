-- Bridge from the historical baseline 0000_cheerful_texas_twister.
-- Rehearse on a restored clone before the user manually runs Drizzle migrate.
ALTER TABLE `users` ADD `intent` enum('seeker','employer') DEFAULT 'seeker' NOT NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD `onboarding_status` enum('completed','pending') DEFAULT 'pending' NOT NULL;
--> statement-breakpoint
UPDATE `users` u INNER JOIN `user_onboarding` uo ON u.`id` = uo.`user_id` SET u.`intent` = uo.`intent`, u.`onboarding_status` = uo.`status`;
--> statement-breakpoint
ALTER TABLE `user_email_preferences` ADD `matched_candidates` boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE `user_email_preferences` ADD `job_seeker_unsubscribed` boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `user_email_preferences` ADD `employer_unsubscribed` boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `user_profile` MODIFY COLUMN `is_profile_public` boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE `job_applications` ADD `cover_letter_url` varchar(500);
--> statement-breakpoint
ALTER TABLE `job_details` MODIFY COLUMN `zipcode` varchar(20);
--> statement-breakpoint
DROP INDEX `active_idx` ON `job_details`;
--> statement-breakpoint
ALTER TABLE `account` RENAME INDEX `idx_session_user_id` TO `idx_account_user_id`;
--> statement-breakpoint
CREATE INDEX `idx_session_expires_at` ON `session` (`expires_at`);
--> statement-breakpoint
ALTER TABLE `work_experiences` ADD `job_title` varchar(100) DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `work_experiences` ADD `description` text;
--> statement-breakpoint
ALTER TABLE `work_experiences` DROP CONSTRAINT `resigned_end_date_check`;
--> statement-breakpoint
ALTER TABLE `work_experiences` ADD CONSTRAINT `resigned_end_date_check` CHECK ((`work_experiences`.`current` = true OR `work_experiences`.`end_date` IS NOT NULL));
--> statement-breakpoint
CREATE TABLE `organization_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organization_id` int NOT NULL,
	`email` varchar(255) NOT NULL,
	`role` enum('owner','admin','recruiter','member') NOT NULL DEFAULT 'member',
	`token` varchar(255) NOT NULL,
	`invited_by` int NOT NULL,
	`status` enum('pending','accepted','expired','cancelled') NOT NULL DEFAULT 'pending',
	`expires_at` timestamp NOT NULL,
	`accepted_at` timestamp,
	`cancelled_at` timestamp,
	`cancelled_by` int,
	`expired_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organization_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organization_invitations_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `job_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`state` varchar(255),
	`city` varchar(255),
	`search_query` text,
	`job_type` json,
	`skills` json,
	`experience_level` json,
	`is_active` boolean NOT NULL DEFAULT true,
	`is_paused` boolean NOT NULL DEFAULT false,
	`include_remote` boolean NOT NULL DEFAULT true,
	`frequency` enum('daily','weekly','monthly') NOT NULL DEFAULT 'weekly',
	`last_sent_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `job_alerts_id` PRIMARY KEY(`id`),
	CONSTRAINT `job_alerts_check_search_query_or_filters` CHECK ((
            JSON_LENGTH(`job_alerts`.`job_type`) > 0 OR
            JSON_LENGTH(`job_alerts`.`skills`) > 0 OR
            JSON_LENGTH(`job_alerts`.`experience_level`) > 0 OR
            `job_alerts`.`city` IS NOT NULL OR
            `job_alerts`.`state` IS NOT NULL OR
            (`job_alerts`.`search_query` IS NOT NULL AND CHAR_LENGTH(TRIM(`job_alerts`.`search_query`)) > 0)
          ))
);
--> statement-breakpoint
CREATE TABLE `job_alert_matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`job_alert_id` int NOT NULL,
	`job_id` int NOT NULL,
	`match_score` float NOT NULL,
	`was_sent` boolean NOT NULL DEFAULT false,
	`matched_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `job_alert_matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_preference_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`preference_type` varchar(100) NOT NULL,
	`context` enum('job_seeker','employer','global') NOT NULL,
	`previous_value` boolean,
	`new_value` boolean NOT NULL,
	`change_source` enum('account_settings','email_link') NOT NULL,
	`ip_address` varchar(45),
	`user_agent` text,
	`changed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_preference_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_skills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`skill_id` int NOT NULL,
	`user_profile_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_skills_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_skills_skill_id_user_profile_id_unique` UNIQUE(`skill_id`,`user_profile_id`)
);
--> statement-breakpoint
CREATE TABLE `job_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_profile_id` int NOT NULL,
	`job_types` json NOT NULL,
	`compensation_types` json NOT NULL,
	`volunteer_hours_per_week` enum('less_than_10_hours','10-20_hours','20-30_hours','30-40_hours','over_40_hours'),
	`work_schedule_days` json,
	`schedule_types` json,
	`work_arrangements` json,
	`commute_time` enum('up_to_15_minutes','up_to_30_minutes','up_to_45_minutes','up_to_60_minutes','up_to_90_minutes_or_more'),
	`willingness_to_relocate` enum('willing_anywhere','willing_domestically','willing_specific_regions','not_willing'),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `job_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `job_preferences_user_profile_id_unique` UNIQUE(`user_profile_id`)
);
--> statement-breakpoint
CREATE TABLE `work_areas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `work_areas_id` PRIMARY KEY(`id`),
	CONSTRAINT `work_areas_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `job_preference_work_areas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`job_preference_id` int NOT NULL,
	`work_area_id` int NOT NULL,
	CONSTRAINT `job_preference_work_areas_id` PRIMARY KEY(`id`),
	CONSTRAINT `unq_preference_work_area` UNIQUE(`job_preference_id`,`work_area_id`)
);
--> statement-breakpoint
ALTER TABLE `organization_invitations` ADD CONSTRAINT `organization_invitations_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `organization_invitations` ADD CONSTRAINT `organization_invitations_invited_by_users_id_fk` FOREIGN KEY (`invited_by`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `organization_invitations` ADD CONSTRAINT `organization_invitations_cancelled_by_users_id_fk` FOREIGN KEY (`cancelled_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `job_alerts` ADD CONSTRAINT `job_alerts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `job_alert_matches` ADD CONSTRAINT `job_alert_matches_job_alert_id_job_alerts_id_fk` FOREIGN KEY (`job_alert_id`) REFERENCES `job_alerts`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `job_alert_matches` ADD CONSTRAINT `job_alert_matches_job_id_job_details_id_fk` FOREIGN KEY (`job_id`) REFERENCES `job_details`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `email_preference_audit_log` ADD CONSTRAINT `email_preference_audit_log_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `user_skills` ADD CONSTRAINT `user_skills_skill_id_skills_id_fk` FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `user_skills` ADD CONSTRAINT `user_skills_user_profile_id_user_profile_id_fk` FOREIGN KEY (`user_profile_id`) REFERENCES `user_profile`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `job_preferences` ADD CONSTRAINT `job_preferences_user_profile_id_user_profile_id_fk` FOREIGN KEY (`user_profile_id`) REFERENCES `user_profile`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `job_preference_work_areas` ADD CONSTRAINT `job_preference_work_areas_job_preference_ids_fk` FOREIGN KEY (`job_preference_id`) REFERENCES `job_preferences`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `job_preference_work_areas` ADD CONSTRAINT `job_preference_work_areas_work_area_id_work_areas_id_fk` FOREIGN KEY (`work_area_id`) REFERENCES `work_areas`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX `idx_org_invitations_org` ON `organization_invitations` (`organization_id`);
--> statement-breakpoint
CREATE INDEX `idx_org_invitations_email` ON `organization_invitations` (`email`);
--> statement-breakpoint
CREATE INDEX `idx_org_invitations_token` ON `organization_invitations` (`token`);
--> statement-breakpoint
CREATE INDEX `idx_org_invitations_status` ON `organization_invitations` (`status`);
--> statement-breakpoint
CREATE INDEX `job_alerts_user_id_idx` ON `job_alerts` (`user_id`);
--> statement-breakpoint
CREATE INDEX `job_alerts_is_active_idx` ON `job_alerts` (`is_active`);
--> statement-breakpoint
CREATE INDEX `job_alerts_is_paused_idx` ON `job_alerts` (`is_paused`);
--> statement-breakpoint
CREATE INDEX `job_alerts_frequency_idx` ON `job_alerts` (`frequency`);
--> statement-breakpoint
CREATE INDEX `job_alerts_user_id_is_active_idx` ON `job_alerts` (`user_id`,`is_active`);
--> statement-breakpoint
CREATE INDEX `job_alert_matches_job_alert_id_idx` ON `job_alert_matches` (`job_alert_id`);
--> statement-breakpoint
CREATE INDEX `job_alert_matches_job_id_idx` ON `job_alert_matches` (`job_id`);
--> statement-breakpoint
CREATE INDEX `job_alert_matches_was_sent_idx` ON `job_alert_matches` (`was_sent`);
--> statement-breakpoint
CREATE INDEX `job_alert_matches_job_alert_id_was_sent_idx` ON `job_alert_matches` (`job_alert_id`,`was_sent`);
--> statement-breakpoint
CREATE INDEX `idx_audit_user_id` ON `email_preference_audit_log` (`user_id`);
--> statement-breakpoint
CREATE INDEX `idx_audit_preference_type` ON `email_preference_audit_log` (`preference_type`);
--> statement-breakpoint
CREATE INDEX `idx_audit_context` ON `email_preference_audit_log` (`context`);
--> statement-breakpoint
CREATE INDEX `idx_audit_changed_at` ON `email_preference_audit_log` (`changed_at`);
--> statement-breakpoint
INSERT INTO `work_areas` (`name`) VALUES
('Administration or office support'),
('Communications/marketing/PR'),
('Community development or outreach'),
('Counseling or social services'),
('Education or teaching'),
('Finance or accounting services'),
('Food and beverage service'),
('Healthcare'),
('Information technology'),
('Legal'),
('Media/design/arts'),
('Ministry or pastoral care'),
('Music or worship arts'),
('Operations or facilities maintenance'),
('Science or research'),
('Supply chain or logistics'),
('Translation or linguistics'),
('Transportation or delivery'),
('Travel/events/hospitality'),
('Youth or children programs');
