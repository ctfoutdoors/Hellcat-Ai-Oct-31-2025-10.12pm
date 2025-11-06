CREATE TABLE `activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('email','call','meeting','note','task','sms','whatsapp') NOT NULL,
	`subject` varchar(500),
	`body` text,
	`contactId` int,
	`companyId` int,
	`dealId` int,
	`userId` int NOT NULL,
	`direction` enum('inbound','outbound'),
	`status` enum('scheduled','completed','cancelled'),
	`scheduledAt` timestamp,
	`completedAt` timestamp,
	`duration` int,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contactId` int,
	`companyId` int,
	`dealId` int,
	`userId` int NOT NULL,
	`direction` enum('inbound','outbound') NOT NULL,
	`phoneNumber` varchar(50),
	`duration` int,
	`recordingUrl` varchar(500),
	`transcription` text,
	`summary` text,
	`sentiment` enum('positive','neutral','negative'),
	`keywords` text,
	`actionItems` text,
	`startedAt` timestamp,
	`endedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaignMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`contactId` int NOT NULL,
	`status` enum('sent','opened','clicked','converted','bounced','unsubscribed') NOT NULL DEFAULT 'sent',
	`sentAt` timestamp,
	`openedAt` timestamp,
	`clickedAt` timestamp,
	`convertedAt` timestamp,
	CONSTRAINT `campaignMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('email','sms','social','ads','event','webinar') NOT NULL,
	`status` enum('draft','scheduled','active','paused','completed') NOT NULL DEFAULT 'draft',
	`budget` int,
	`spent` int NOT NULL DEFAULT 0,
	`targetAudience` text,
	`startDate` timestamp,
	`endDate` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` varchar(255),
	`threadId` varchar(255),
	`contactId` int,
	`companyId` int,
	`dealId` int,
	`userId` int NOT NULL,
	`direction` enum('inbound','outbound') NOT NULL,
	`subject` varchar(500),
	`bodyText` text,
	`bodyHtml` text,
	`fromAddress` varchar(320),
	`toAddresses` text,
	`ccAddresses` text,
	`bccAddresses` text,
	`openedAt` timestamp,
	`clickedAt` timestamp,
	`repliedAt` timestamp,
	`bouncedAt` timestamp,
	`sentiment` enum('positive','neutral','negative'),
	`intent` enum('question','objection','interest','purchase','support'),
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emails_id` PRIMARY KEY(`id`),
	CONSTRAINT `emails_messageId_unique` UNIQUE(`messageId`)
);
--> statement-breakpoint
CREATE TABLE `predictions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`modelType` enum('churn','deal_win','lead_score','next_purchase','upsell') NOT NULL,
	`entityType` enum('contact','company','deal') NOT NULL,
	`entityId` int NOT NULL,
	`score` int NOT NULL,
	`confidence` int,
	`factors` text,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `predictions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prescriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('retention','upsell','cross_sell','engagement','nurture') NOT NULL,
	`entityType` enum('contact','company','deal') NOT NULL,
	`entityId` int NOT NULL,
	`priority` int NOT NULL DEFAULT 50,
	`title` varchar(500) NOT NULL,
	`description` text,
	`recommendedAction` text,
	`expectedImpact` text,
	`status` enum('pending','approved','rejected','completed') NOT NULL DEFAULT 'pending',
	`approvedBy` int,
	`approvedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `prescriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`assignedTo` int NOT NULL,
	`createdBy` int NOT NULL,
	`contactId` int,
	`companyId` int,
	`dealId` int,
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`status` enum('todo','in_progress','completed','cancelled') NOT NULL DEFAULT 'todo',
	`dueDate` timestamp,
	`completedAt` timestamp,
	`reminderAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflowExecutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowId` int NOT NULL,
	`entityType` varchar(50),
	`entityId` int,
	`status` enum('success','failed','partial') NOT NULL,
	`actionsExecuted` text,
	`errorMessage` text,
	`executionTimeMs` int,
	`executedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workflowExecutions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`triggerType` enum('record_created','record_updated','field_changed','scheduled','manual') NOT NULL,
	`triggerModule` enum('contacts','companies','deals','tasks') NOT NULL,
	`triggerConditions` text,
	`actions` text,
	`isActive` int NOT NULL DEFAULT 1,
	`executionCount` int NOT NULL DEFAULT 0,
	`lastExecutedAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_type` ON `activities` (`type`);--> statement-breakpoint
CREATE INDEX `idx_contact` ON `activities` (`contactId`);--> statement-breakpoint
CREATE INDEX `idx_company` ON `activities` (`companyId`);--> statement-breakpoint
CREATE INDEX `idx_deal` ON `activities` (`dealId`);--> statement-breakpoint
CREATE INDEX `idx_user` ON `activities` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_scheduled` ON `activities` (`scheduledAt`);--> statement-breakpoint
CREATE INDEX `idx_contact` ON `calls` (`contactId`);--> statement-breakpoint
CREATE INDEX `idx_user` ON `calls` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_started` ON `calls` (`startedAt`);--> statement-breakpoint
CREATE INDEX `unique_member` ON `campaignMembers` (`campaignId`,`contactId`);--> statement-breakpoint
CREATE INDEX `idx_campaign` ON `campaignMembers` (`campaignId`);--> statement-breakpoint
CREATE INDEX `idx_contact` ON `campaignMembers` (`contactId`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `campaignMembers` (`status`);--> statement-breakpoint
CREATE INDEX `idx_type` ON `campaigns` (`type`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `campaigns` (`status`);--> statement-breakpoint
CREATE INDEX `idx_dates` ON `campaigns` (`startDate`,`endDate`);--> statement-breakpoint
CREATE INDEX `idx_message` ON `emails` (`messageId`);--> statement-breakpoint
CREATE INDEX `idx_thread` ON `emails` (`threadId`);--> statement-breakpoint
CREATE INDEX `idx_contact` ON `emails` (`contactId`);--> statement-breakpoint
CREATE INDEX `idx_user` ON `emails` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_sent` ON `emails` (`sentAt`);--> statement-breakpoint
CREATE INDEX `idx_entity` ON `predictions` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `idx_model` ON `predictions` (`modelType`);--> statement-breakpoint
CREATE INDEX `idx_score` ON `predictions` (`score`);--> statement-breakpoint
CREATE INDEX `idx_expires` ON `predictions` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `idx_entity` ON `prescriptions` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `idx_type` ON `prescriptions` (`type`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `prescriptions` (`status`);--> statement-breakpoint
CREATE INDEX `idx_priority` ON `prescriptions` (`priority`);--> statement-breakpoint
CREATE INDEX `idx_assigned` ON `tasks` (`assignedTo`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `tasks` (`status`);--> statement-breakpoint
CREATE INDEX `idx_due_date` ON `tasks` (`dueDate`);--> statement-breakpoint
CREATE INDEX `idx_contact` ON `tasks` (`contactId`);--> statement-breakpoint
CREATE INDEX `idx_company` ON `tasks` (`companyId`);--> statement-breakpoint
CREATE INDEX `idx_deal` ON `tasks` (`dealId`);--> statement-breakpoint
CREATE INDEX `idx_workflow` ON `workflowExecutions` (`workflowId`);--> statement-breakpoint
CREATE INDEX `idx_entity` ON `workflowExecutions` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `idx_executed` ON `workflowExecutions` (`executedAt`);--> statement-breakpoint
CREATE INDEX `idx_trigger` ON `workflows` (`triggerModule`,`triggerType`);--> statement-breakpoint
CREATE INDEX `idx_active` ON `workflows` (`isActive`);