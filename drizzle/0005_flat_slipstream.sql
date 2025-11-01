CREATE TABLE `credentialsAuditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`credentialId` int NOT NULL,
	`action` enum('CREATED','UPDATED','ACCESSED','DELETED','TESTED') NOT NULL,
	`userId` int NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` varchar(255),
	`success` int NOT NULL DEFAULT 1,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `credentialsAuditLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credentialsVault` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceName` varchar(100) NOT NULL,
	`serviceType` enum('SHIPSTATION','WOOCOMMERCE','ZOHO_DESK','OPENAI','GOOGLE_DRIVE','GOOGLE_DOCS','GOOGLE_SHEETS','GMAIL','GOOGLE_CALENDAR','OTHER') NOT NULL,
	`credentialKey` varchar(100) NOT NULL,
	`credentialValue` text NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`lastTested` timestamp,
	`testStatus` enum('SUCCESS','FAILED','NOT_TESTED') DEFAULT 'NOT_TESTED',
	`expiresAt` timestamp,
	`metadata` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `credentialsVault_id` PRIMARY KEY(`id`)
);
