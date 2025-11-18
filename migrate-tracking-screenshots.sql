-- Add tracking_screenshots table for AI vision-based tracking
CREATE TABLE IF NOT EXISTS `tracking_screenshots` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `shipmentId` INT,
  `trackingNumber` VARCHAR(255) NOT NULL,
  `carrier` VARCHAR(100) NOT NULL,
  `carrierUrl` TEXT NOT NULL,
  `screenshotUrl` TEXT NOT NULL,
  `screenshotKey` VARCHAR(500) NOT NULL,
  `extractedStatus` VARCHAR(100),
  `extractedLocation` TEXT,
  `extractedEta` TIMESTAMP NULL,
  `extractedDetails` TEXT,
  `capturedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `processingStatus` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `errorMessage` TEXT,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_shipment` (`shipmentId`),
  INDEX `idx_tracking` (`trackingNumber`),
  INDEX `idx_status` (`processingStatus`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
