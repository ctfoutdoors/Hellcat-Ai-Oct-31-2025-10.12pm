CREATE TABLE `caseDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`originalFileName` varchar(255) NOT NULL,
	`fileSize` int NOT NULL,
	`fileType` varchar(100) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` text NOT NULL,
	`category` enum('damage_photo','packaging_photo','receipt','invoice','correspondence','tracking_info','other') NOT NULL,
	`description` text,
	`tags` text,
	`thumbnailUrl` text,
	`extractedText` text,
	`version` int NOT NULL DEFAULT 1,
	`parentDocumentId` int,
	`isEvidence` boolean NOT NULL DEFAULT true,
	`isPublic` boolean NOT NULL DEFAULT false,
	`uploadedBy` int NOT NULL,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deletedAt` timestamp,
	CONSTRAINT `caseDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documentAccessLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`userId` int NOT NULL,
	`action` enum('viewed','downloaded','uploaded','updated','deleted','shared') NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documentAccessLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documentVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`version` int NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` text NOT NULL,
	`fileSize` int NOT NULL,
	`changeNotes` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documentVersions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_case` ON `caseDocuments` (`caseId`);--> statement-breakpoint
CREATE INDEX `idx_category` ON `caseDocuments` (`category`);--> statement-breakpoint
CREATE INDEX `idx_uploaded_by` ON `caseDocuments` (`uploadedBy`);--> statement-breakpoint
CREATE INDEX `idx_evidence` ON `caseDocuments` (`isEvidence`);--> statement-breakpoint
CREATE INDEX `idx_document` ON `documentAccessLog` (`documentId`);--> statement-breakpoint
CREATE INDEX `idx_user` ON `documentAccessLog` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_action` ON `documentAccessLog` (`action`);--> statement-breakpoint
CREATE INDEX `idx_document` ON `documentVersions` (`documentId`);--> statement-breakpoint
CREATE INDEX `idx_version` ON `documentVersions` (`documentId`,`version`);