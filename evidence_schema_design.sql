-- ============================================================================
-- EVIDENCE COLLECTION & LOCATION INTELLIGENCE SCHEMA
-- ============================================================================

-- Evidence Items Table
-- Stores all evidence with automatic categorization and OCR
CREATE TABLE IF NOT EXISTS `evidence_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `caseId` INT NOT NULL,
  `evidenceType` VARCHAR(100) NOT NULL, -- 'document', 'photo', 'screenshot', 'tracking_data', 'email', 'other'
  `category` VARCHAR(100), -- Auto-categorized: 'proof_of_delivery', 'invoice', 'tracking_timeline', 'correspondence', etc.
  `title` VARCHAR(500) NOT NULL,
  `description` TEXT,
  `fileUrl` TEXT,
  `fileName` VARCHAR(500),
  `fileType` VARCHAR(100),
  `fileSize` INT,
  `thumbnailUrl` TEXT,
  
  -- OCR and Analysis
  `ocrText` LONGTEXT, -- Extracted text from OCR
  `ocrConfidence` DECIMAL(5,2), -- 0-100 confidence score
  `aiSummary` TEXT, -- AI-generated summary of evidence
  `aiTags` JSON, -- AI-generated tags: ["dimensional_weight", "surcharge", "delivery_photo"]
  
  -- Metadata
  `capturedAt` TIMESTAMP, -- When evidence was captured/created
  `uploadedBy` INT NOT NULL,
  `uploadedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `verifiedBy` INT, -- Who verified this evidence
  `verifiedAt` TIMESTAMP,
  `isVerified` BOOLEAN DEFAULT FALSE,
  
  -- Legal metadata
  `chainOfCustody` JSON, -- Track who accessed/modified: [{userId, action, timestamp}]
  `legalHold` BOOLEAN DEFAULT FALSE, -- Prevent deletion if under legal hold
  
  INDEX `case_idx` (`caseId`),
  INDEX `type_idx` (`evidenceType`),
  INDEX `category_idx` (`category`),
  INDEX `uploaded_idx` (`uploadedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tracking Events Table
-- Complete scan history for package journey analysis
CREATE TABLE IF NOT EXISTS `tracking_events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `caseId` INT NOT NULL,
  `trackingNumber` VARCHAR(100) NOT NULL,
  `carrier` VARCHAR(100) NOT NULL,
  
  -- Event Details
  `eventType` VARCHAR(100) NOT NULL, -- 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'exception'
  `eventDescription` TEXT NOT NULL,
  `eventTimestamp` TIMESTAMP NOT NULL,
  `eventCode` VARCHAR(50), -- Carrier-specific code
  
  -- Location Data
  `locationName` VARCHAR(500), -- "FEDEX FACILITY - MEMPHIS TN"
  `locationAddress` TEXT,
  `locationCity` VARCHAR(255),
  `locationState` VARCHAR(100),
  `locationZip` VARCHAR(20),
  `locationCountry` VARCHAR(100),
  `latitude` DECIMAL(10, 7),
  `longitude` DECIMAL(10, 7),
  
  -- Facility Intelligence (linked to facility_locations table)
  `facilityId` INT, -- Foreign key to facility_locations
  
  -- Timing Analysis
  `delayMinutes` INT, -- Calculated delay from previous scan
  `isNightScan` BOOLEAN, -- TRUE if scan occurred between 8PM-6AM
  `isWeekendScan` BOOLEAN,
  `scanHour` INT, -- 0-23 for time pattern analysis
  
  -- Metadata
  `rawData` JSON, -- Original API response for reference
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  INDEX `case_idx` (`caseId`),
  INDEX `tracking_idx` (`trackingNumber`),
  INDEX `timestamp_idx` (`eventTimestamp`),
  INDEX `facility_idx` (`facilityId`),
  INDEX `night_scan_idx` (`isNightScan`),
  INDEX `delay_idx` (`delayMinutes`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Facility Locations Table
-- Geocoded locations with confidence labels and verification
CREATE TABLE IF NOT EXISTS `facility_locations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `carrier` VARCHAR(100) NOT NULL,
  `facilityName` VARCHAR(500) NOT NULL,
  `facilityType` VARCHAR(100), -- 'hub', 'distribution_center', 'local_facility', 'retail_location'
  
  -- Address
  `address` TEXT,
  `city` VARCHAR(255),
  `state` VARCHAR(100),
  `zip` VARCHAR(20),
  `country` VARCHAR(100),
  
  -- Geocoding
  `latitude` DECIMAL(10, 7),
  `longitude` DECIMAL(10, 7),
  `geocodedAt` TIMESTAMP,
  
  -- Confidence & Verification
  `confidenceLabel` VARCHAR(50) NOT NULL, -- 'Known', 'Suspected', 'Unverified', 'Investigating'
  `verificationSources` JSON, -- ["carrier_directory", "google_maps", "public_records"]
  `verificationNotes` TEXT,
  `lastVerified` TIMESTAMP,
  `verifiedBy` INT,
  
  -- Anomaly Flags
  `isAnomaly` BOOLEAN DEFAULT FALSE,
  `anomalyReason` TEXT, -- "Residential address listed as hub"
  
  -- Performance Metrics
  `averageProcessingMinutes` INT,
  `totalScans` INT DEFAULT 0,
  `delayIncidents` INT DEFAULT 0,
  `performanceScore` DECIMAL(5,2), -- 0-100 score based on historical data
  
  -- Metadata
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  
  INDEX `carrier_idx` (`carrier`),
  INDEX `confidence_idx` (`confidenceLabel`),
  INDEX `location_idx` (`latitude`, `longitude`),
  INDEX `performance_idx` (`performanceScore`),
  UNIQUE INDEX `unique_facility` (`carrier`, `facilityName`, `city`, `state`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Delivery Proof Screenshots Table
-- Captured delivery photos and proof from carrier websites
CREATE TABLE IF NOT EXISTS `delivery_proofs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `caseId` INT NOT NULL,
  `trackingNumber` VARCHAR(100) NOT NULL,
  `carrier` VARCHAR(100) NOT NULL,
  
  -- Screenshot Data
  `screenshotUrl` TEXT NOT NULL,
  `thumbnailUrl` TEXT,
  `capturedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  -- Delivery Details Extracted
  `deliveryDate` TIMESTAMP,
  `deliveryTime` VARCHAR(50),
  `deliveryLocation` VARCHAR(500), -- "Front Porch", "Mailbox", etc.
  `recipientName` VARCHAR(255),
  `signatureRequired` BOOLEAN,
  `signatureObtained` BOOLEAN,
  
  -- Photo Analysis
  `hasDeliveryPhoto` BOOLEAN DEFAULT FALSE,
  `deliveryPhotoUrl` TEXT,
  `photoAnalysis` JSON, -- AI analysis: {objects_detected: ["package", "porch"], confidence: 0.95}
  
  -- Metadata
  `sourceUrl` TEXT, -- Original carrier tracking page URL
  `capturedBy` INT NOT NULL,
  `evidenceItemId` INT, -- Link to evidence_items table
  
  INDEX `case_idx` (`caseId`),
  INDEX `tracking_idx` (`trackingNumber`),
  INDEX `delivery_date_idx` (`deliveryDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hub Performance Analysis Table
-- Aggregated metrics for problematic hub identification
CREATE TABLE IF NOT EXISTS `hub_performance_metrics` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `facilityId` INT NOT NULL,
  `analysisDate` DATE NOT NULL,
  
  -- Volume Metrics
  `totalPackages` INT DEFAULT 0,
  `delayedPackages` INT DEFAULT 0,
  `onTimePackages` INT DEFAULT 0,
  
  -- Timing Analysis
  `avgDayProcessingMinutes` INT,
  `avgNightProcessingMinutes` INT,
  `dayScans` INT DEFAULT 0,
  `nightScans` INT DEFAULT 0,
  
  -- Performance Indicators
  `delayRate` DECIMAL(5,2), -- Percentage of delayed packages
  `avgDelayMinutes` INT,
  `maxDelayMinutes` INT,
  `performanceScore` DECIMAL(5,2), -- 0-100
  
  -- Trend Flags
  `isProblematic` BOOLEAN DEFAULT FALSE,
  `trendDirection` VARCHAR(50), -- 'improving', 'declining', 'stable'
  `alertLevel` VARCHAR(50), -- 'normal', 'warning', 'critical'
  
  -- Metadata
  `calculatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  INDEX `facility_idx` (`facilityId`),
  INDEX `date_idx` (`analysisDate`),
  INDEX `problematic_idx` (`isProblematic`),
  UNIQUE INDEX `unique_analysis` (`facilityId`, `analysisDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Evidence Tags Table (for flexible tagging)
CREATE TABLE IF NOT EXISTS `evidence_tags` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `evidenceId` INT NOT NULL,
  `tag` VARCHAR(100) NOT NULL,
  `tagType` VARCHAR(50), -- 'auto', 'manual', 'ai_generated'
  `confidence` DECIMAL(5,2), -- For AI-generated tags
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  
  INDEX `evidence_idx` (`evidenceId`),
  INDEX `tag_idx` (`tag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
