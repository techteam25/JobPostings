CREATE TABLE IF NOT EXISTS `job_preference_work_areas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`job_preference_id` int NOT NULL,
	`work_area_id` int NOT NULL,
	CONSTRAINT `job_preference_work_areas_id` PRIMARY KEY(`id`),
	CONSTRAINT `unq_preference_work_area` UNIQUE(`job_preference_id`,`work_area_id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `work_areas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `work_areas_id` PRIMARY KEY(`id`),
	CONSTRAINT `work_areas_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
ALTER TABLE `job_preference_work_areas` ADD CONSTRAINT `job_preference_work_areas_job_preference_ids_fk` FOREIGN KEY (`job_preference_id`) REFERENCES `job_preferences`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `job_preference_work_areas` ADD CONSTRAINT `job_preference_work_areas_work_area_id_work_areas_id_fk` FOREIGN KEY (`work_area_id`) REFERENCES `work_areas`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO work_areas (name) VALUES ('Administration or office support'),
                                     ('Communications/marketing/PR'),
                                     ('Community development or outreach'),
                                     ('Counseling or social services'),
                                     ('Education or teaching'),
                                     ('Finance or accounting services'),
                                     ('Food and beverage service'),
                                     ('Healthcare'),
                                     ('Information technology'),
                                     ('Legal'),
                                     ('Media/design/arts'),
                                     ('Ministry or pastoral care'),
                                     ('Music or worship arts'),
                                     ('Operations or facilities maintenance'),
                                     ('Science or research'),
                                     ('Supply chain or logistics'),
                                     ('Translation or linguistics'),
                                     ('Transportation or delivery'),
                                     ('Travel/events/hospitality'),
                                     ('Youth or children programs')