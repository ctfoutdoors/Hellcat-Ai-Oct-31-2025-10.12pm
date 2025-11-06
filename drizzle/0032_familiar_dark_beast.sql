CREATE TABLE `inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`sku` varchar(100) NOT NULL,
	`quantityOnHand` int NOT NULL DEFAULT 0,
	`quantityAllocated` int NOT NULL DEFAULT 0,
	`quantityAvailable` int NOT NULL DEFAULT 0,
	`quantityOnOrder` int NOT NULL DEFAULT 0,
	`reorderPoint` int NOT NULL DEFAULT 10,
	`reorderQuantity` int NOT NULL DEFAULT 50,
	`warehouseLocation` varchar(100),
	`binLocation` varchar(100),
	`averageCost` int NOT NULL DEFAULT 0,
	`lastCost` int NOT NULL DEFAULT 0,
	`totalValue` int NOT NULL DEFAULT 0,
	`lastCountDate` timestamp,
	`lastCountBy` int,
	`lastReceivedDate` timestamp,
	`lastSoldDate` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventoryTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`sku` varchar(100) NOT NULL,
	`transactionType` enum('purchase','sale','adjustment','transfer','return','damage','count') NOT NULL,
	`quantity` int NOT NULL,
	`quantityBefore` int NOT NULL,
	`quantityAfter` int NOT NULL,
	`unitCost` int,
	`totalCost` int,
	`referenceType` varchar(50),
	`referenceId` int,
	`referenceNumber` varchar(100),
	`fromLocation` varchar(100),
	`toLocation` varchar(100),
	`notes` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventoryTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventoryValuationSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`snapshotDate` timestamp NOT NULL,
	`snapshotType` enum('daily','weekly','monthly','manual') NOT NULL,
	`totalQuantity` int NOT NULL,
	`totalValue` int NOT NULL,
	`totalProducts` int NOT NULL,
	`valuationFIFO` int NOT NULL,
	`valuationLIFO` int NOT NULL,
	`valuationWeightedAvg` int NOT NULL,
	`byCategory` text,
	`byLocation` text,
	`topProducts` text,
	`avgTurnoverRate` int,
	`slowMovingCount` int,
	`deadStockCount` int,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventoryValuationSnapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchaseOrderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`poId` int NOT NULL,
	`lineNumber` int NOT NULL,
	`productId` int,
	`vendorSku` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`quantity` int NOT NULL,
	`unitPrice` int NOT NULL,
	`lineTotal` int NOT NULL,
	`quantityReceived` int NOT NULL DEFAULT 0,
	`quantityRemaining` int NOT NULL,
	`skuMatchConfidence` int,
	`skuMatchedBy` enum('ai','alias','manual','exact'),
	`skuAliasId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `purchaseOrderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchaseOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`poNumber` varchar(100) NOT NULL,
	`vendorId` int NOT NULL,
	`poDate` timestamp NOT NULL,
	`expectedDeliveryDate` timestamp,
	`status` enum('draft','pending_approval','approved','ordered','partially_received','received','cancelled') NOT NULL DEFAULT 'draft',
	`subtotal` int NOT NULL,
	`taxAmount` int NOT NULL DEFAULT 0,
	`shippingCost` int NOT NULL DEFAULT 0,
	`totalAmount` int NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'USD',
	`shipToAddress` text,
	`shippingMethod` varchar(100),
	`trackingNumber` varchar(100),
	`scannedFromDocument` int NOT NULL DEFAULT 0,
	`documentUrl` text,
	`aiConfidence` int,
	`aiExtractedData` text,
	`approvedBy` int,
	`approvedAt` timestamp,
	`notes` text,
	`internalNotes` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `purchaseOrders_id` PRIMARY KEY(`id`),
	CONSTRAINT `purchaseOrders_poNumber_unique` UNIQUE(`poNumber`)
);
--> statement-breakpoint
CREATE TABLE `receivingItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`receivingId` int NOT NULL,
	`poItemId` int NOT NULL,
	`productId` int NOT NULL,
	`quantityOrdered` int NOT NULL,
	`quantityReceived` int NOT NULL,
	`quantityAccepted` int NOT NULL,
	`quantityRejected` int NOT NULL DEFAULT 0,
	`condition` enum('good','damaged','defective','wrong_item') NOT NULL DEFAULT 'good',
	`lotNumber` varchar(100),
	`expiryDate` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `receivingItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `receivings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`receivingNumber` varchar(100) NOT NULL,
	`poId` int NOT NULL,
	`receivedDate` timestamp NOT NULL,
	`status` enum('draft','completed','cancelled') NOT NULL DEFAULT 'draft',
	`trackingNumber` varchar(100),
	`carrier` varchar(50),
	`inspectionStatus` enum('pending','passed','failed','partial'),
	`inspectedBy` int,
	`inspectedAt` timestamp,
	`warehouseLocation` varchar(100),
	`notes` text,
	`damageNotes` text,
	`attachments` text,
	`receivedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `receivings_id` PRIMARY KEY(`id`),
	CONSTRAINT `receivings_receivingNumber_unique` UNIQUE(`receivingNumber`)
);
--> statement-breakpoint
CREATE TABLE `skuAliases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`ourSku` varchar(100) NOT NULL,
	`aliasType` enum('vendor','customer','channel') NOT NULL,
	`aliasEntityId` int NOT NULL,
	`aliasEntityName` varchar(255) NOT NULL,
	`aliasSku` varchar(100) NOT NULL,
	`aliasDescription` text,
	`learnedBy` enum('ai','manual','import') NOT NULL,
	`confidence` int NOT NULL DEFAULT 100,
	`usageCount` int NOT NULL DEFAULT 0,
	`lastUsed` timestamp,
	`isActive` int NOT NULL DEFAULT 1,
	`verifiedBy` int,
	`verifiedAt` timestamp,
	`notes` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `skuAliases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_inv_product` ON `inventory` (`productId`);--> statement-breakpoint
CREATE INDEX `idx_inv_sku` ON `inventory` (`sku`);--> statement-breakpoint
CREATE INDEX `idx_inv_location` ON `inventory` (`warehouseLocation`);--> statement-breakpoint
CREATE INDEX `idx_trans_product` ON `inventoryTransactions` (`productId`);--> statement-breakpoint
CREATE INDEX `idx_trans_type` ON `inventoryTransactions` (`transactionType`);--> statement-breakpoint
CREATE INDEX `idx_trans_date` ON `inventoryTransactions` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_trans_ref` ON `inventoryTransactions` (`referenceType`,`referenceId`);--> statement-breakpoint
CREATE INDEX `idx_snapshot_date` ON `inventoryValuationSnapshots` (`snapshotDate`);--> statement-breakpoint
CREATE INDEX `idx_snapshot_type` ON `inventoryValuationSnapshots` (`snapshotType`);--> statement-breakpoint
CREATE INDEX `idx_poi_po` ON `purchaseOrderItems` (`poId`);--> statement-breakpoint
CREATE INDEX `idx_poi_product` ON `purchaseOrderItems` (`productId`);--> statement-breakpoint
CREATE INDEX `idx_po_vendor` ON `purchaseOrders` (`vendorId`);--> statement-breakpoint
CREATE INDEX `idx_po_status` ON `purchaseOrders` (`status`);--> statement-breakpoint
CREATE INDEX `idx_po_date` ON `purchaseOrders` (`poDate`);--> statement-breakpoint
CREATE INDEX `idx_ri_receiving` ON `receivingItems` (`receivingId`);--> statement-breakpoint
CREATE INDEX `idx_ri_product` ON `receivingItems` (`productId`);--> statement-breakpoint
CREATE INDEX `idx_receiving_po` ON `receivings` (`poId`);--> statement-breakpoint
CREATE INDEX `idx_receiving_date` ON `receivings` (`receivedDate`);--> statement-breakpoint
CREATE INDEX `idx_alias_product` ON `skuAliases` (`productId`);--> statement-breakpoint
CREATE INDEX `idx_alias_sku` ON `skuAliases` (`aliasSku`);--> statement-breakpoint
CREATE INDEX `idx_alias_entity` ON `skuAliases` (`aliasType`,`aliasEntityId`);