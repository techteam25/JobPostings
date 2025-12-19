ALTER TABLE `job_applications` ADD CONSTRAINT `unique_applicant_job` UNIQUE(`job_id`,`applicant_id`);--> statement-breakpoint
CREATE INDEX `user_applications_idx` ON `job_applications` (`applicant_id`,`applied_at`);--> statement-breakpoint
CREATE INDEX `job_applications_idx` ON `job_applications` (`job_id`,`applied_at`);--> statement-breakpoint
CREATE INDEX `user_job_lookup_idx` ON `job_applications` (`job_id`,`applicant_id`);