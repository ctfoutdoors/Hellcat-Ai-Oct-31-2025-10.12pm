CREATE TABLE `caseActivityLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`activityType` enum('CREATED','UPDATED','STATUS_CHANGED','ASSIGNED','REASSIGNED','COMMENTED','ATTACHMENT_ADDED','ATTACHMENT_REMOVED','EMAIL_SENT','EMAIL_RECEIVED','PAYMENT_RECEIVED','WORKFLOW_STARTED','WORKFLOW_COMPLETED','PORTAL_SUBMITTED','EVIDENCE_ADDED','LETTER_GENERATED','OTHER') NOT NULL,
	`description` text NOT NULL,
	`actorId` int,
	`actorName` varchar(255),
	`actorType` enum('USER','SYSTEM','API','WORKFLOW') NOT NULL DEFAULT 'USER',
	`fieldChanged` varchar(100),
	`oldValue` text,
	`newValue` text,
	`metadata` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `caseActivityLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `caseComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`content` text NOT NULL,
	`contentType` enum('TEXT','MARKDOWN','HTML') NOT NULL DEFAULT 'TEXT',
	`parentCommentId` int,
	`threadDepth` int DEFAULT 0,
	`authorId` int NOT NULL,
	`authorName` varchar(255),
	`isInternal` boolean DEFAULT true,
	`isEdited` boolean DEFAULT false,
	`editedAt` timestamp,
	`mentionedUserIds` text,
	`attachmentUrls` text,
	`reactionCounts` text,
	`isPinned` boolean DEFAULT false,
	`isResolved` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deletedAt` timestamp,
	CONSTRAINT `caseComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commentAttachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`commentId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileSize` int,
	`mimeType` varchar(100),
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commentAttachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commentMentions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`commentId` int NOT NULL,
	`caseId` int NOT NULL,
	`mentionedUserId` int NOT NULL,
	`mentionedByUserId` int NOT NULL,
	`isRead` boolean DEFAULT false,
	`readAt` timestamp,
	`notificationSent` boolean DEFAULT false,
	`notificationSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commentMentions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commentReactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`commentId` int NOT NULL,
	`userId` int NOT NULL,
	`emoji` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commentReactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userNotificationSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`notifyOnMention` boolean DEFAULT true,
	`mentionEmailEnabled` boolean DEFAULT true,
	`mentionPushEnabled` boolean DEFAULT true,
	`notifyOnComment` boolean DEFAULT true,
	`commentEmailEnabled` boolean DEFAULT false,
	`notifyOnAssignment` boolean DEFAULT true,
	`notifyOnStatusChange` boolean DEFAULT true,
	`dailyDigestEnabled` boolean DEFAULT false,
	`weeklyDigestEnabled` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userNotificationSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `userNotificationSettings_userId_unique` UNIQUE(`userId`)
);
