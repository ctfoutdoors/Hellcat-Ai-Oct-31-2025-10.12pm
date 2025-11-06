CREATE TABLE `aiChatbotPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`preferredActions` text,
	`frequentCommands` text,
	`communicationStyle` enum('formal','casual','concise','detailed') DEFAULT 'casual',
	`recommendationFrequency` enum('high','medium','low') DEFAULT 'medium',
	`acceptedRecommendations` text,
	`dismissedRecommendations` text,
	`workflowPatterns` text,
	`lastPage` varchar(64),
	`lastEntityType` varchar(64),
	`lastEntityId` int,
	`lastSessionId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aiChatbotPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `aiChatbotPreferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `conversationHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`page` varchar(64),
	`entityType` varchar(64),
	`entityId` int,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversationHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversationSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`page` varchar(64),
	`entityType` varchar(64),
	`entityId` int,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`endedAt` timestamp,
	`messageCount` int DEFAULT 0,
	`summary` text,
	`metadata` text,
	CONSTRAINT `conversationSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `conversationSessions_sessionId_unique` UNIQUE(`sessionId`)
);
