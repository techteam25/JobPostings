ALTER TABLE `user_profile` ADD `phone_number` varchar(20);--> statement-breakpoint
ALTER TABLE `user_profile` ADD `address` varchar(255);--> statement-breakpoint
ALTER TABLE `user_profile` ADD `city` varchar(100);--> statement-breakpoint
ALTER TABLE `user_profile` ADD `state` varchar(100);--> statement-breakpoint
ALTER TABLE `user_profile` ADD `zip_code` varchar(10);--> statement-breakpoint
ALTER TABLE `user_profile` ADD `country` varchar(100) DEFAULT 'US';