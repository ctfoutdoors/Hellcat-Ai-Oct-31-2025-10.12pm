CREATE TABLE `reminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`reminderType` enum('response_deadline','follow_up','escalation','document_submission','custom') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`dueDate` timestamp NOT NULL,
	`status` enum('pending','sent','completed','cancelled') NOT NULL DEFAULT 'pending',
	`notifyDaysBefore` int DEFAULT 3,
	`notificationSent` int NOT NULL DEFAULT 0,
	`notificationSentAt` timestamp,
	`priority` enum('LOW','MEDIUM','HIGH','URGENT') NOT NULL DEFAULT 'MEDIUM',
	`assignedTo` int,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `reminders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_case` ON `reminders` (`caseId`);--> statement-breakpoint
CREATE INDEX `idx_due_date` ON `reminders` (`dueDate`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `reminders` (`status`);