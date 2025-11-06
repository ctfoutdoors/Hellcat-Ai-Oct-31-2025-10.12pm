ALTER TABLE `cases` ADD `caseType` enum('DAMAGE','ADJUSTMENT','SLA') DEFAULT 'DAMAGE' NOT NULL;--> statement-breakpoint
ALTER TABLE `cases` ADD `damageType` enum('TUBE','ROD','TIP','BENT_EYE','STRUCTURAL','PACKAGING','OTHER');--> statement-breakpoint
ALTER TABLE `cases` ADD `damageDescription` text;--> statement-breakpoint
ALTER TABLE `cases` ADD `damageSeverity` enum('MINOR','MODERATE','SEVERE','TOTAL_LOSS');--> statement-breakpoint
ALTER TABLE `cases` ADD `packagingSpacing` varchar(255);--> statement-breakpoint
ALTER TABLE `cases` ADD `customerStatement` text;--> statement-breakpoint
ALTER TABLE `cases` ADD `insuranceProvider` varchar(255);--> statement-breakpoint
ALTER TABLE `cases` ADD `insurancePolicyNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `cases` ADD `insuranceCoverage` int;--> statement-breakpoint
ALTER TABLE `cases` ADD `insuranceClaimNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `cases` ADD `insuranceClaimStatus` enum('NOT_FILED','FILED','PENDING','APPROVED','DENIED');--> statement-breakpoint
ALTER TABLE `cases` ADD `carrierGuarantee` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `cases` ADD `carrierGuaranteeClaimNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `cases` ADD `carrierGuaranteeStatus` enum('NOT_FILED','FILED','PENDING','APPROVED','DENIED');--> statement-breakpoint
ALTER TABLE `cases` ADD `promisedDeliveryDate` timestamp;--> statement-breakpoint
ALTER TABLE `cases` ADD `actualDeliveryDate` timestamp;--> statement-breakpoint
ALTER TABLE `cases` ADD `delayReason` text;--> statement-breakpoint
ALTER TABLE `cases` ADD `adjustmentReason` text;--> statement-breakpoint
ALTER TABLE `cases` ADD `invoiceReference` varchar(100);