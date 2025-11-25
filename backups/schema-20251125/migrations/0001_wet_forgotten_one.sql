CREATE TABLE `ai_analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` varchar(100) NOT NULL,
	`entityId` int NOT NULL,
	`analysisType` varchar(100) NOT NULL,
	`prompt` text,
	`result` text,
	`model` varchar(100),
	`tokensUsed` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('competitor_change','new_lead','linkedin_update','system','custom') NOT NULL,
	`severity` enum('info','warning','critical') NOT NULL DEFAULT 'info',
	`title` varchar(500) NOT NULL,
	`message` text,
	`relatedEntityType` varchar(100),
	`relatedEntityId` int,
	`read` boolean NOT NULL DEFAULT false,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`domain` varchar(255),
	`industry` varchar(255),
	`size` varchar(100),
	`location` text,
	`description` text,
	`website` varchar(500),
	`linkedinUrl` varchar(500),
	`revenue` varchar(100),
	`foundedYear` int,
	`aiSummary` text,
	`lastEnriched` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competitors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int,
	`name` varchar(255) NOT NULL,
	`website` varchar(500),
	`monitoringEnabled` boolean NOT NULL DEFAULT true,
	`monitoringFrequency` varchar(50) DEFAULT 'daily',
	`lastChecked` timestamp,
	`changeCount` int DEFAULT 0,
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `competitors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`url` varchar(1000),
	`content` text,
	`aiSummary` text,
	`category` varchar(255),
	`tags` text,
	`author` varchar(255),
	`publishedDate` timestamp,
	`sourceType` varchar(100),
	`embedding` text,
	`relevanceScore` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int,
	`personId` int,
	`source` varchar(255) NOT NULL,
	`sourceUrl` varchar(1000),
	`status` enum('new','qualified','contacted','converted','rejected') NOT NULL DEFAULT 'new',
	`aiScore` int,
	`aiReasoning` text,
	`contactEmail` varchar(320),
	`contactPhone` varchar(50),
	`notes` text,
	`tags` text,
	`assignedTo` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monitoring_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('competitor','lead','document','linkedin','custom') NOT NULL,
	`targetId` int,
	`schedule` varchar(100),
	`enabled` boolean NOT NULL DEFAULT true,
	`lastRun` timestamp,
	`nextRun` timestamp,
	`status` enum('idle','running','success','failed') NOT NULL DEFAULT 'idle',
	`config` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monitoring_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `people` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`currentCompanyId` int,
	`currentTitle` varchar(255),
	`linkedinUrl` varchar(500),
	`email` varchar(320),
	`phone` varchar(50),
	`location` text,
	`bio` text,
	`education` text,
	`careerHistory` text,
	`skills` text,
	`publications` text,
	`speakingEngagements` text,
	`aiBackgroundSummary` text,
	`influenceScore` int,
	`lastLinkedinSync` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `people_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`competitorId` int,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(255),
	`pricing` text,
	`features` text,
	`url` varchar(1000),
	`aiAnalysis` text,
	`lastUpdated` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scraping_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int,
	`targetUrl` varchar(1000) NOT NULL,
	`status` enum('pending','running','success','failed') NOT NULL DEFAULT 'pending',
	`itemsFound` int DEFAULT 0,
	`errorMessage` text,
	`duration` int,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `scraping_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `web_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`url` varchar(1000) NOT NULL,
	`type` enum('lead_source','news','competitor','linkedin','custom') NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`scrapingConfig` text,
	`lastScraped` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `web_sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `competitors` ADD CONSTRAINT `competitors_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leads` ADD CONSTRAINT `leads_companyId_companies_id_fk` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leads` ADD CONSTRAINT `leads_personId_people_id_fk` FOREIGN KEY (`personId`) REFERENCES `people`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leads` ADD CONSTRAINT `leads_assignedTo_users_id_fk` FOREIGN KEY (`assignedTo`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `monitoring_jobs` ADD CONSTRAINT `monitoring_jobs_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `people` ADD CONSTRAINT `people_currentCompanyId_companies_id_fk` FOREIGN KEY (`currentCompanyId`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_competitorId_competitors_id_fk` FOREIGN KEY (`competitorId`) REFERENCES `competitors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scraping_sessions` ADD CONSTRAINT `scraping_sessions_jobId_monitoring_jobs_id_fk` FOREIGN KEY (`jobId`) REFERENCES `monitoring_jobs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `entity_idx` ON `ai_analyses` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `ai_analyses` (`analysisType`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `alerts` (`userId`);--> statement-breakpoint
CREATE INDEX `read_idx` ON `alerts` (`read`);--> statement-breakpoint
CREATE INDEX `severity_idx` ON `alerts` (`severity`);--> statement-breakpoint
CREATE INDEX `domain_idx` ON `companies` (`domain`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `companies` (`name`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `competitors` (`name`);--> statement-breakpoint
CREATE INDEX `priority_idx` ON `competitors` (`priority`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `documents` (`category`);--> statement-breakpoint
CREATE INDEX `published_idx` ON `documents` (`publishedDate`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `leads` (`status`);--> statement-breakpoint
CREATE INDEX `score_idx` ON `leads` (`aiScore`);--> statement-breakpoint
CREATE INDEX `company_idx` ON `leads` (`companyId`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `monitoring_jobs` (`type`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `monitoring_jobs` (`status`);--> statement-breakpoint
CREATE INDEX `next_run_idx` ON `monitoring_jobs` (`nextRun`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `people` (`name`);--> statement-breakpoint
CREATE INDEX `linkedin_idx` ON `people` (`linkedinUrl`);--> statement-breakpoint
CREATE INDEX `company_idx` ON `people` (`currentCompanyId`);--> statement-breakpoint
CREATE INDEX `competitor_idx` ON `products` (`competitorId`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `products` (`category`);--> statement-breakpoint
CREATE INDEX `job_idx` ON `scraping_sessions` (`jobId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `scraping_sessions` (`status`);--> statement-breakpoint
CREATE INDEX `started_idx` ON `scraping_sessions` (`startedAt`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `web_sources` (`type`);--> statement-breakpoint
CREATE INDEX `enabled_idx` ON `web_sources` (`enabled`);