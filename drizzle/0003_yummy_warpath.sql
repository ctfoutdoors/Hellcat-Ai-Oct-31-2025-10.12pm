CREATE TABLE `dataReconciliationLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shipmentDataId` int NOT NULL,
	`sourceId` int NOT NULL,
	`reconciliationType` enum('MATCH','CONFLICT','NEW','UPDATE') NOT NULL,
	`fieldName` varchar(100),
	`oldValue` text,
	`newValue` text,
	`resolution` enum('AUTO_RESOLVED','MANUAL_REVIEW','IGNORED','ACCEPTED'),
	`confidence` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dataReconciliationLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dataSources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceName` varchar(100) NOT NULL,
	`sourceType` enum('SHIPSTATION','GOOGLE_SHEETS','WOOCOMMERCE','MANUAL','API','OTHER') NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`reliabilityScore` int NOT NULL DEFAULT 100,
	`totalRecords` int NOT NULL DEFAULT 0,
	`conflictCount` int NOT NULL DEFAULT 0,
	`lastSyncAt` timestamp,
	`configuration` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dataSources_id` PRIMARY KEY(`id`),
	CONSTRAINT `dataSources_sourceName_unique` UNIQUE(`sourceName`)
);
--> statement-breakpoint
CREATE TABLE `shipmentData` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trackingNumber` varchar(100) NOT NULL,
	`carrier` varchar(50) NOT NULL,
	`serviceType` varchar(100),
	`orderId` varchar(100),
	`customerName` varchar(255),
	`shipmentDate` timestamp,
	`deliveryDate` timestamp,
	`quotedAmount` int,
	`actualAmount` int,
	`dimensions` varchar(100),
	`weight` int,
	`productData` text,
	`primarySourceId` int NOT NULL,
	`confirmedBySources` text,
	`hasConflict` int NOT NULL DEFAULT 0,
	`conflictDetails` text,
	`caseId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shipmentData_id` PRIMARY KEY(`id`)
);
