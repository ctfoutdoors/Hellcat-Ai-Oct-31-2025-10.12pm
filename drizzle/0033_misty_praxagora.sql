CREATE TABLE `crmDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileType` varchar(100) NOT NULL,
	`fileSize` int NOT NULL,
	`fileUrl` text NOT NULL,
	`documentType` enum('contract','proposal','invoice','receipt','presentation','report','other') NOT NULL DEFAULT 'other',
	`contactId` int,
	`companyId` int,
	`dealId` int,
	`emailMessageId` int,
	`description` text,
	`tags` text,
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crmDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crmEmailTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`bodyHtml` text NOT NULL,
	`bodyText` text,
	`variables` text,
	`category` varchar(100),
	`useCount` int NOT NULL DEFAULT 0,
	`lastUsedAt` timestamp,
	`createdBy` int NOT NULL,
	`isShared` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crmEmailTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`threadId` int NOT NULL,
	`messageId` varchar(255),
	`inReplyTo` varchar(255),
	`subject` varchar(500) NOT NULL,
	`fromEmail` varchar(320) NOT NULL,
	`fromName` varchar(255),
	`toEmails` text NOT NULL,
	`ccEmails` text,
	`bccEmails` text,
	`bodyHtml` text,
	`bodyText` text,
	`direction` enum('inbound','outbound') NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`hasAttachments` boolean NOT NULL DEFAULT false,
	`attachmentUrls` text,
	`sentAt` timestamp,
	`deliveredAt` timestamp,
	`openedAt` timestamp,
	`clickedAt` timestamp,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailThreads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subject` varchar(500) NOT NULL,
	`contactId` int,
	`companyId` int,
	`dealId` int,
	`messageCount` int NOT NULL DEFAULT 0,
	`participants` text,
	`status` enum('active','archived','spam') NOT NULL DEFAULT 'active',
	`isRead` boolean NOT NULL DEFAULT false,
	`isStarred` boolean NOT NULL DEFAULT false,
	`lastMessageAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailThreads_id` PRIMARY KEY(`id`)
);
