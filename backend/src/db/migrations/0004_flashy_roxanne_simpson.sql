ALTER TABLE `job_details` MODIFY COLUMN `state` varchar(50);--> statement-breakpoint
ALTER TABLE `job_details` MODIFY COLUMN `zipcode` int;--> statement-breakpoint
ALTER TABLE `job_details` ADD `country` varchar(100) NOT NULL;