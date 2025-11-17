-- ============================================================================
-- MINIMAL INTELLIGENCE SUITE SETUP
-- Creates only essential tables and sample data for testing
-- ============================================================================

-- Create products table if not exists (simplified for Intelligence Suite)
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(255),
  weight DECIMAL(10,2),
  dimensions VARCHAR(100),
  cost DECIMAL(10,2),
  price DECIMAL(10,2),
  margin DECIMAL(10,2),
  supplier VARCHAR(255),
  leadTimeDays INT,
  isActive BOOLEAN DEFAULT TRUE,
  lifecycleState ENUM('concept', 'development', 'pre_launch', 'active_launch', 'post_launch', 'cruise', 'end_of_life') DEFAULT 'concept',
  intelligenceMetadata JSON,
  variantSummary JSON,
  lastIntelligenceUpdate TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX sku_idx (sku)
);

-- Create launch_missions table
CREATE TABLE IF NOT EXISTS launch_missions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  productId INT NOT NULL,
  missionName VARCHAR(255) NOT NULL,
  launchDatetime TIMESTAMP NOT NULL,
  currentPhase ENUM('initial_briefing', 'pre_launch', 'launch_execution', 'post_launch', 'cruise') DEFAULT 'initial_briefing' NOT NULL,
  settingsVersion INT NOT NULL,
  missionConfig JSON,
  readinessSnapshot JSON,
  collaborators JSON,
  status ENUM('planning', 'active', 'completed', 'aborted') DEFAULT 'planning' NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX product_idx (productId),
  INDEX launch_date_idx (launchDatetime)
);

-- Create mission_events table
CREATE TABLE IF NOT EXISTS mission_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  missionId INT NOT NULL,
  eventType VARCHAR(100) NOT NULL,
  eventData JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX mission_idx (missionId),
  INDEX created_idx (createdAt)
);

-- Create intelligence_settings table
CREATE TABLE IF NOT EXISTS intelligence_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  version INT NOT NULL UNIQUE,
  timingRules JSON,
  thresholds JSON,
  templates JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX version_idx (version)
);

-- Insert sample products
INSERT INTO products (
  sku, name, description, category, weight, dimensions, cost, price, margin,
  supplier, leadTimeDays, isActive, lifecycleState, intelligenceMetadata,
  variantSummary, lastIntelligenceUpdate
) VALUES
(
  'FISH-LINE-PRO-20LB',
  'ProCast Fishing Line - 20lb Test',
  'Premium monofilament fishing line with enhanced abrasion resistance. Perfect for freshwater and light saltwater fishing.',
  'Fishing Line',
  0.5,
  '4x4x1',
  8.50,
  24.99,
  16.49,
  'Fishing Gear Wholesale Inc',
  14,
  TRUE,
  'development',
  '{"assets":[{"type":"product_images","status":"in_progress"},{"type":"packaging_design","status":"completed"},{"type":"marketing_copy","status":"completed"}],"requirements":[{"name":"Product Photography","completed":false},{"name":"Packaging Design","completed":true},{"name":"Marketing Copy","completed":true},{"name":"Inventory Stocked","completed":false}],"readinessScore":65,"blockers":["Awaiting product photography","Initial inventory order pending"]}',
  '{"total":3,"ready":1,"blocked":2,"avgReadiness":55}',
  NOW()
),
(
  'TACKLE-BOX-ELITE',
  'Elite Tackle Storage System',
  'Professional-grade tackle box with 8 compartments, waterproof seals, and rust-resistant latches. Holds up to 200 pieces of tackle.',
  'Tackle Storage',
  3.2,
  '14x9x8',
  22.00,
  59.99,
  37.99,
  'Outdoor Gear Direct',
  21,
  TRUE,
  'pre_launch',
  '{"assets":[{"type":"product_images","status":"completed"},{"type":"packaging_design","status":"completed"},{"type":"marketing_copy","status":"completed"},{"type":"instruction_manual","status":"completed"}],"requirements":[{"name":"Product Photography","completed":true},{"name":"Packaging Design","completed":true},{"name":"Marketing Copy","completed":true},{"name":"Inventory Stocked","completed":true},{"name":"Listing Created","completed":false}],"readinessScore":88,"blockers":["Awaiting final listing approval"]}',
  '{"total":2,"ready":2,"blocked":0,"avgReadiness":92}',
  NOW()
),
(
  'LURE-COMBO-BASS',
  'Bass Master Lure Collection',
  'Complete bass fishing lure set with 12 proven patterns. Includes crankbaits, spinnerbaits, and soft plastics in a premium storage case.',
  'Fishing Lures',
  1.8,
  '10x7x3',
  15.50,
  44.99,
  29.49,
  'Lure Manufacturers Ltd',
  28,
  TRUE,
  'concept',
  '{"assets":[{"type":"product_images","status":"not_started"},{"type":"packaging_design","status":"in_progress"},{"type":"marketing_copy","status":"not_started"}],"requirements":[{"name":"Product Photography","completed":false},{"name":"Packaging Design","completed":false},{"name":"Marketing Copy","completed":false},{"name":"Inventory Stocked","completed":false},{"name":"Supplier Contract","completed":true}],"readinessScore":22,"blockers":["Awaiting prototype samples","Packaging design not started","No marketing materials"]}',
  '{"total":1,"ready":0,"blocked":1,"avgReadiness":20}',
  NOW()
)
ON DUPLICATE KEY UPDATE
  lifecycleState = VALUES(lifecycleState),
  intelligenceMetadata = VALUES(intelligenceMetadata),
  variantSummary = VALUES(variantSummary),
  lastIntelligenceUpdate = VALUES(lastIntelligenceUpdate);

-- Insert sample launch missions (using product IDs from above)
INSERT INTO launch_missions (
  productId, missionName, launchDatetime, status, settingsVersion, missionConfig, collaborators, currentPhase
)
SELECT 
  p.id,
  CONCAT('Q2 2024 Launch: ', p.name),
  DATE_ADD(NOW(), INTERVAL 30 DAY),
  'planning',
  1,
  '{"phases":[{"name":"Planning","tasks":[],"checklists":[]},{"name":"Preparation","tasks":[],"checklists":[]},{"name":"Review","tasks":[],"checklists":[]},{"name":"Launch","tasks":[],"checklists":[]}]}',
  '{"internal":[{"userId":1,"role":"owner"}]}',
  'initial_briefing'
FROM products p
WHERE p.sku = 'TACKLE-BOX-ELITE'
ON DUPLICATE KEY UPDATE updatedAt = NOW();

INSERT INTO launch_missions (
  productId, missionName, launchDatetime, status, settingsVersion, missionConfig, collaborators, currentPhase
)
SELECT 
  p.id,
  CONCAT('Rapid Launch: ', p.name),
  DATE_ADD(NOW(), INTERVAL 7 DAY),
  'active',
  1,
  '{"phases":[{"name":"Preparation","tasks":[],"checklists":[]},{"name":"Launch","tasks":[],"checklists":[]}]}',
  '{"internal":[{"userId":1,"role":"owner"}]}',
  'pre_launch'
FROM products p
WHERE p.sku = 'FISH-LINE-PRO-20LB'
ON DUPLICATE KEY UPDATE updatedAt = NOW();

-- Insert default intelligence settings
INSERT IGNORE INTO intelligence_settings (version, timingRules, thresholds, templates)
VALUES (
  1,
  '{"assetDeadlineDays":30,"copyDeadlineDays":21,"freezeWindowDays":7,"goNoGoTimingDays":3,"reviewTimingDays":14,"escalationDelayHours":24,"syncFrequencyMinutes":60}',
  '{"inventoryThresholds":{"default":100},"safetyStockMultiplier":1.5,"variantReadinessMinScore":75,"minimumApprovalQuorum":2}',
  '{"defaultTasks":[],"defaultChecklists":[],"assetRequirements":[],"notificationRules":[],"phaseRequirements":[],"fallbackOwners":[]}'
);

SELECT 'Intelligence Suite tables and sample data created successfully!' AS status;
