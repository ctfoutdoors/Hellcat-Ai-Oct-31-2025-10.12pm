CREATE TABLE `customerIdentities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`name` varchar(255) NOT NULL,
	`currentAddress` text,
	`addressHistory` text,
	`firstSeenAt` timestamp NOT NULL DEFAULT (now()),
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`totalOrders` int NOT NULL DEFAULT 0,
	`lifetimeValue` int NOT NULL DEFAULT 0,
	`disputeCount` int NOT NULL DEFAULT 0,
	`masterIdentityId` int,
	`mergedAt` timestamp,
	`mergedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customerIdentities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customerIdentityMatches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`identity1Id` int NOT NULL,
	`identity2Id` int NOT NULL,
	`matchType` enum('exact_email','exact_phone','fuzzy_name','address_overlap','manual') NOT NULL,
	`confidenceScore` int NOT NULL,
	`matchReason` text,
	`status` enum('pending','approved','rejected','auto_merged') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customerIdentityMatches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customerRiskScores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerIdentityId` int NOT NULL,
	`riskScore` int NOT NULL,
	`riskLevel` enum('low','medium','high','critical') NOT NULL,
	`disputeHistoryScore` int DEFAULT 0,
	`supportTicketScore` int DEFAULT 0,
	`reviewSentimentScore` int DEFAULT 0,
	`orderFrequencyScore` int DEFAULT 0,
	`engagementScore` int DEFAULT 0,
	`scoreBreakdown` text,
	`recommendations` text,
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customerRiskScores_id` PRIMARY KEY(`id`),
	CONSTRAINT `customerRiskScores_customerIdentityId_unique` UNIQUE(`customerIdentityId`)
);
--> statement-breakpoint
CREATE TABLE `dataEnrichmentLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int,
	`customerIdentityId` int,
	`operation` varchar(100) NOT NULL,
	`source` varchar(50) NOT NULL,
	`status` enum('pending','success','failed','partial') NOT NULL,
	`dataFetched` text,
	`errorMessage` text,
	`durationMs` int,
	`triggeredBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dataEnrichmentLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `klaviyoProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`klaviyoId` varchar(100) NOT NULL,
	`customerIdentityId` int,
	`email` varchar(320) NOT NULL,
	`emailOpenRate` int,
	`emailClickRate` int,
	`totalEmailsSent` int DEFAULT 0,
	`totalEmailsOpened` int DEFAULT 0,
	`totalEmailsClicked` int DEFAULT 0,
	`lifetimeValue` int DEFAULT 0,
	`totalOrders` int DEFAULT 0,
	`averageOrderValue` int,
	`averageReviewRating` int,
	`totalReviews` int DEFAULT 0,
	`segments` text,
	`tags` text,
	`firstPurchaseAt` timestamp,
	`lastPurchaseAt` timestamp,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `klaviyoProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `klaviyoProfiles_klaviyoId_unique` UNIQUE(`klaviyoId`)
);
--> statement-breakpoint
CREATE TABLE `klaviyoReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`klaviyoProfileId` int NOT NULL,
	`orderId` varchar(100),
	`productName` varchar(500),
	`rating` int NOT NULL,
	`reviewText` text,
	`reviewedAt` timestamp NOT NULL,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `klaviyoReviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orderSources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` varchar(100) NOT NULL,
	`channel` enum('woocommerce','amazon','ebay','tiktok','shipstation','other') NOT NULL,
	`customerIdentityId` int,
	`customerEmail` varchar(320),
	`customerName` varchar(255),
	`customerPhone` varchar(20),
	`orderTotal` int NOT NULL,
	`orderStatus` varchar(50),
	`paymentMethod` varchar(100),
	`shippingAddress` text,
	`trackingNumber` varchar(100),
	`shippingMethod` varchar(100),
	`itemCount` int DEFAULT 0,
	`items` text,
	`externalData` text,
	`orderDate` timestamp NOT NULL,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orderSources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reamazeTickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reamazeId` varchar(100) NOT NULL,
	`customerIdentityId` int,
	`customerEmail` varchar(320) NOT NULL,
	`subject` varchar(500),
	`status` varchar(50),
	`category` varchar(100),
	`priority` varchar(50),
	`firstMessage` text,
	`messageCount` int DEFAULT 0,
	`satisfactionScore` int,
	`resolutionTimeHours` int,
	`sentimentScore` int,
	`createdAt` timestamp NOT NULL,
	`resolvedAt` timestamp,
	`lastMessageAt` timestamp,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reamazeTickets_id` PRIMARY KEY(`id`),
	CONSTRAINT `reamazeTickets_reamazeId_unique` UNIQUE(`reamazeId`)
);
