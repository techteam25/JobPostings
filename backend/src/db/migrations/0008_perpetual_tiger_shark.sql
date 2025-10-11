CREATE TABLE `sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`access_token` varchar(512),
	`refresh_token` varchar(255) NOT NULL,
	`user_agent` varchar(255),
	`ip_address` varchar(45),
	`is_active` boolean NOT NULL DEFAULT true,
	`expires_at` timestamp NOT NULL,
	`refresh_expires_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`last_used_at` timestamp,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessions_refresh_token_unique` UNIQUE(`refresh_token`)
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
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `organization_idx` ON `subscriptions` (`organization_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `subscriptions` (`status`);--> statement-breakpoint
CREATE INDEX `provider_idx` ON `subscriptions` (`provider_id`);