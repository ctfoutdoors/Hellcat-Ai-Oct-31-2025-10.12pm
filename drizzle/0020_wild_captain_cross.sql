CREATE TABLE `assignmentRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`carrier` enum('FEDEX','UPS','USPS','DHL','ALL'),
	`issueType` varchar(100),
	`priority` int DEFAULT 0,
	`amountRange` text,
	`strategy` enum('ROUND_ROBIN','LEAST_LOADED','SPECIALIZED','RANDOM') NOT NULL,
	`assignToRole` enum('ADMIN','MANAGER','AGENT','SPECIALIST'),
	`assignToUserId` int,
	`isActive` boolean DEFAULT true,
	`assignmentCount` int DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assignmentRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `caseAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`assignedTo` int NOT NULL,
	`assignmentMethod` enum('AUTO','MANUAL','RULE_BASED') NOT NULL,
	`assignmentRuleId` int,
	`assignedBy` int,
	`status` enum('ACTIVE','COMPLETED','REASSIGNED','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	`acceptedAt` timestamp,
	`completedAt` timestamp,
	`timeToAccept` int,
	`timeToComplete` int,
	`notes` text,
	CONSTRAINT `caseAssignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teamMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`role` enum('ADMIN','MANAGER','AGENT','SPECIALIST') NOT NULL,
	`carrierSpecialties` text,
	`issueTypeSpecialties` text,
	`maxConcurrentCases` int DEFAULT 10,
	`currentCaseCount` int DEFAULT 0,
	`averageResolutionTime` int DEFAULT 0,
	`successRate` int DEFAULT 0,
	`totalCasesHandled` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`isAvailable` boolean DEFAULT true,
	`lastAssignedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teamMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workloadSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamMemberId` int NOT NULL,
	`activeCases` int NOT NULL,
	`pendingCases` int NOT NULL,
	`completedToday` int NOT NULL,
	`averageResponseTime` int,
	`utilizationRate` int,
	`snapshotDate` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workloadSnapshots_id` PRIMARY KEY(`id`)
);
