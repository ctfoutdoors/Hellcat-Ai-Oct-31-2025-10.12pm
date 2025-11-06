CREATE TABLE `radialMenuSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`animationSpeed` int NOT NULL DEFAULT 300,
	`radius` int NOT NULL DEFAULT 120,
	`bubbleSize` int NOT NULL DEFAULT 56,
	`casesPageActions` text,
	`caseDetailActions` text,
	`dashboardActions` text,
	`ordersPageActions` text,
	`productsPageActions` text,
	`auditsPageActions` text,
	`reportsPageActions` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `radialMenuSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `radialMenuSettings_userId_unique` UNIQUE(`userId`)
);
