CREATE TABLE IF NOT EXISTS `job_insights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`job_id` int NOT NULL,
	`organization_id` int NOT NULL,
	`view_count` int DEFAULT 0,
	`application_count` int DEFAULT 0,
	CONSTRAINT `job_insights_id` PRIMARY KEY(`id`),
	CONSTRAINT `application_count_must_be_gt_0` CHECK((`job_insights`.`application_count` >= 0))
);
