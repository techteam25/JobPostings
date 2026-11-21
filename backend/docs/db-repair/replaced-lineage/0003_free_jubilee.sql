ALTER TABLE `job_details` MODIFY COLUMN `experience` varchar(255);--> statement-breakpoint
CREATE INDEX `experience_idx` ON `job_details` (`experience`);