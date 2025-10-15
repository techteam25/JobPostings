# ALTER TABLE `job_applications` DROP FOREIGN KEY `fk_application_reviewer`;
--> statement-breakpoint
ALTER TABLE `job_details` MODIFY COLUMN `job_type` enum('full-time','part-time','contract','volunteer','internship') NOT NULL;--> statement-breakpoint
# ALTER TABLE `users` ADD CONSTRAINT `users_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
# ALTER TABLE `job_applications` DROP COLUMN `custom_answers`;--> statement-breakpoint
# ALTER TABLE `job_applications` DROP COLUMN `reviewed_by`;--> statement-breakpoint
# ALTER TABLE `job_applications` DROP COLUMN `rating`;