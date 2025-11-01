ALTER TABLE `cases` ADD `purchaseDate` timestamp;--> statement-breakpoint
ALTER TABLE `cases` ADD `purchaseSource` enum('AUTHORIZED_DEALER','DIRECT','THIRD_PARTY','OTHER');--> statement-breakpoint
ALTER TABLE `cases` ADD `purchaseVerified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `cases` ADD `purchaseVerificationNotes` text;--> statement-breakpoint
ALTER TABLE `cases` ADD `receiptRequired` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `cases` ADD `receiptUploaded` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `cases` ADD `warrantyEligible` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `cases` ADD `warrantyExpirationDate` timestamp;--> statement-breakpoint
ALTER TABLE `cases` ADD `claimEligibilityStatus` enum('PENDING','ELIGIBLE','INELIGIBLE','REQUIRES_RECEIPT') DEFAULT 'PENDING';--> statement-breakpoint
ALTER TABLE `cases` ADD `intakeSource` enum('MANUAL','TYPEFORM','GOOGLE_SHEETS','WEBHOOK','API') DEFAULT 'MANUAL';--> statement-breakpoint
ALTER TABLE `cases` ADD `intakeTimestamp` timestamp;