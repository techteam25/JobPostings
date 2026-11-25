ALTER TABLE `job_applications` DROP FOREIGN KEY `fk_application_job`;
--> statement-breakpoint
ALTER TABLE `job_applications` DROP FOREIGN KEY `fk_application_applicant`;
--> statement-breakpoint
ALTER TABLE `job_details` DROP FOREIGN KEY `fk_job_employer`;
--> statement-breakpoint
ALTER TABLE `job_applications` ADD CONSTRAINT `fk_application_job` FOREIGN KEY (`job_id`) REFERENCES `job_details`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_applications` ADD CONSTRAINT `fk_application_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_details` ADD CONSTRAINT `fk_job_employer` FOREIGN KEY (`employer_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;