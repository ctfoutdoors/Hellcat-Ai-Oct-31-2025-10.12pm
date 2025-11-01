CREATE TABLE `aiInsights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`insightType` enum('PATTERN','PREDICTION','RECOMMENDATION','ANOMALY') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`confidence` int NOT NULL,
	`relatedCaseIds` text,
	`actionTaken` int NOT NULL DEFAULT 0,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiInsights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledgeBase` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` enum('ADMIN','LEGAL','CASE','CASE_LAW') NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`tags` text,
	`relatedCaseIds` text,
	`successRate` int,
	`confidence` int NOT NULL DEFAULT 100,
	`source` varchar(255),
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledgeBase_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shipmentAudits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shipstationAccountId` int NOT NULL,
	`shipmentId` varchar(100) NOT NULL,
	`trackingNumber` varchar(100) NOT NULL,
	`carrier` varchar(50) NOT NULL,
	`quotedAmount` int NOT NULL,
	`actualAmount` int NOT NULL,
	`variance` int NOT NULL,
	`varianceType` enum('OVERCHARGE','UNDERCHARGE','ACCURATE') NOT NULL,
	`auditStatus` enum('PENDING','FLAGGED','RESOLVED','DISPUTED') NOT NULL DEFAULT 'PENDING',
	`caseId` int,
	`shipmentDate` timestamp NOT NULL,
	`auditedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shipmentAudits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shipstationAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountName` varchar(255) NOT NULL,
	`apiKey` text NOT NULL,
	`apiSecret` text NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shipstationAccounts_id` PRIMARY KEY(`id`)
);
