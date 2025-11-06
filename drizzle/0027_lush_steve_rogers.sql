CREATE TABLE `letterTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`content` text NOT NULL,
	`category` enum('initial_dispute','follow_up','escalation','final_demand','resolution') NOT NULL,
	`carrier` enum('FEDEX','UPS','USPS','DHL','ALL'),
	`caseType` varchar(100),
	`tags` text,
	`isPublic` boolean NOT NULL DEFAULT false,
	`isFavorite` boolean NOT NULL DEFAULT false,
	`isDefault` boolean NOT NULL DEFAULT false,
	`version` int NOT NULL DEFAULT 1,
	`parentTemplateId` int,
	`usageCount` int NOT NULL DEFAULT 0,
	`successRate` int NOT NULL DEFAULT 0,
	`avgResponseTime` int,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deletedAt` timestamp,
	CONSTRAINT `letterTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `templateShares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`sharedWith` int NOT NULL,
	`permission` enum('view','edit') NOT NULL DEFAULT 'view',
	`sharedBy` int NOT NULL,
	`sharedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `templateShares_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `templateVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`version` int NOT NULL,
	`content` text NOT NULL,
	`changeNotes` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `templateVersions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_category` ON `letterTemplates` (`category`);--> statement-breakpoint
CREATE INDEX `idx_carrier` ON `letterTemplates` (`carrier`);--> statement-breakpoint
CREATE INDEX `idx_public` ON `letterTemplates` (`isPublic`);--> statement-breakpoint
CREATE INDEX `idx_favorite` ON `letterTemplates` (`isFavorite`);--> statement-breakpoint
CREATE INDEX `idx_created_by` ON `letterTemplates` (`createdBy`);--> statement-breakpoint
CREATE INDEX `idx_template` ON `templateShares` (`templateId`);--> statement-breakpoint
CREATE INDEX `idx_user` ON `templateShares` (`sharedWith`);--> statement-breakpoint
CREATE INDEX `idx_template` ON `templateVersions` (`templateId`);--> statement-breakpoint
CREATE INDEX `idx_version` ON `templateVersions` (`templateId`,`version`);