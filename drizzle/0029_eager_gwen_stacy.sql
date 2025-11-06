CREATE TABLE `letterPatterns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`carrier` enum('FEDEX','UPS','USPS','DHL','OTHER') NOT NULL,
	`disputeReason` varchar(255) NOT NULL,
	`letterContent` text NOT NULL,
	`tone` enum('professional','firm','conciliatory') NOT NULL,
	`outcome` enum('approved','partial','rejected','pending'),
	`recoveredAmount` int,
	`claimedAmount` int,
	`successRate` int,
	`timeTaken` int,
	`notes` text,
	`markedSuccessful` int NOT NULL DEFAULT 0,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `letterPatterns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_carrier` ON `letterPatterns` (`carrier`);--> statement-breakpoint
CREATE INDEX `idx_outcome` ON `letterPatterns` (`outcome`);--> statement-breakpoint
CREATE INDEX `idx_successful` ON `letterPatterns` (`markedSuccessful`);