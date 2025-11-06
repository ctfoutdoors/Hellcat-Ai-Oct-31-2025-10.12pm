CREATE TABLE `aiConversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`conversationId` varchar(100) NOT NULL,
	`message` text NOT NULL,
	`role` enum('USER','ASSISTANT','SYSTEM') NOT NULL,
	`context` text,
	`actionTaken` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiConversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `certifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`certificationType` enum('ROD_TUBE','QUALITY','COMPLIANCE','OTHER') NOT NULL,
	`productId` int,
	`certificationName` varchar(255) NOT NULL,
	`specifications` text,
	`attachments` text,
	`certificationDate` timestamp NOT NULL,
	`expiryDate` timestamp,
	`status` enum('ACTIVE','EXPIRED','PENDING_RENEWAL') NOT NULL DEFAULT 'ACTIVE',
	`notes` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `certifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `channels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channelName` varchar(255) NOT NULL,
	`channelType` enum('SHIPSTATION','WOOCOMMERCE','SHOPIFY','AMAZON','EBAY','CUSTOM') NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`configuration` text,
	`lastSyncAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `channels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` varchar(100) NOT NULL,
	`orderNumber` varchar(100) NOT NULL,
	`orderDate` timestamp NOT NULL,
	`orderStatus` varchar(50) NOT NULL,
	`shipstationAccountId` int,
	`channelId` int NOT NULL,
	`customerName` varchar(255),
	`customerEmail` varchar(320),
	`shippingAddress` text,
	`billingAddress` text,
	`orderTotal` int NOT NULL,
	`shippingCost` int,
	`taxAmount` int,
	`trackingNumber` varchar(100),
	`carrier` varchar(50),
	`serviceType` varchar(100),
	`shipDate` timestamp,
	`orderItems` text,
	`orderNotes` text,
	`syncedFromShipstation` int NOT NULL DEFAULT 0,
	`lastSyncAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` varchar(100) NOT NULL,
	`productName` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100),
	`weight` int,
	`dimensions` varchar(100),
	`price` int,
	`cost` int,
	`images` text,
	`specifications` text,
	`channelMappings` text,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_sku_unique` UNIQUE(`sku`)
);
