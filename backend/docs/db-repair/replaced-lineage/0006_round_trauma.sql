CREATE TABLE `application_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`application_id` int NOT NULL,
	`user_id` int NOT NULL,
	`note` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `application_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `application_notes` ADD CONSTRAINT `fk_note_application` FOREIGN KEY (`application_id`) REFERENCES `job_applications`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `application_notes` ADD CONSTRAINT `fk_note_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `application_idx` ON `application_notes` (`application_id`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `application_notes` (`user_id`);