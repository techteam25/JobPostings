ALTER TABLE `users` ADD `intent` enum('seeker','employer') DEFAULT 'seeker' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `onboarding_status` enum('completed','pending') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
UPDATE `users` u INNER JOIN `user_onboarding` uo ON u.`id` = uo.`user_id` SET u.`intent` = uo.`intent`, u.`onboarding_status` = uo.`status`;