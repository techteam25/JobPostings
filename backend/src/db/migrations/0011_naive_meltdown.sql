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
ALTER TABLE `user_onboarding` ADD CONSTRAINT `user_onboarding_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;