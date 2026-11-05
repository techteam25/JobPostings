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
ALTER TABLE `work_experiences` ADD `job_title` varchar(100) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `work_experiences` ADD `description` varchar(100);--> statement-breakpoint
ALTER TABLE `user_skills` ADD CONSTRAINT `user_skills_skill_id_skills_id_fk` FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_skills` ADD CONSTRAINT `user_skills_user_profile_id_user_profile_id_fk` FOREIGN KEY (`user_profile_id`) REFERENCES `user_profile`(`id`) ON DELETE cascade ON UPDATE no action;