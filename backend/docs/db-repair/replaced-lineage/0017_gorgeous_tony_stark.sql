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
ALTER TABLE `organization_invitations` ADD CONSTRAINT `organization_invitations_organization_id_organizations_id_fk` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization_invitations` ADD CONSTRAINT `organization_invitations_invited_by_users_id_fk` FOREIGN KEY (`invited_by`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization_invitations` ADD CONSTRAINT `organization_invitations_cancelled_by_users_id_fk` FOREIGN KEY (`cancelled_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_org_invitations_org` ON `organization_invitations` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_org_invitations_email` ON `organization_invitations` (`email`);--> statement-breakpoint
CREATE INDEX `idx_org_invitations_token` ON `organization_invitations` (`token`);--> statement-breakpoint
CREATE INDEX `idx_org_invitations_status` ON `organization_invitations` (`status`);