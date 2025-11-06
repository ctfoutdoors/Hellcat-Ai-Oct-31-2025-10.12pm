CREATE TABLE `caseTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`carrier` enum('FEDEX','UPS','USPS','DHL','OTHER'),
	`disputeType` varchar(100),
	`priority` enum('LOW','MEDIUM','HIGH','URGENT') DEFAULT 'MEDIUM',
	`templateData` text NOT NULL,
	`usageCount` int NOT NULL DEFAULT 0,
	`lastUsed` timestamp,
	`isPublic` int NOT NULL DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `caseTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_created_by` ON `caseTemplates` (`createdBy`);--> statement-breakpoint
CREATE INDEX `idx_carrier` ON `caseTemplates` (`carrier`);