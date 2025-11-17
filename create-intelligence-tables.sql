-- Create Intelligence Suite tables directly
-- This bypasses the interactive Drizzle migration

CREATE TABLE IF NOT EXISTS intelligence_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  productId INT NOT NULL UNIQUE,
  lifecycleState ENUM('concept', 'development', 'pre_launch', 'active_launch', 'post_launch', 'cruise', 'end_of_life') DEFAULT 'concept' NOT NULL,
  readinessScore INT DEFAULT 0 NOT NULL,
  intelligenceMetadata JSON,
  variantSummary JSON,
  lastIntelligenceUpdate TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX product_idx (productId),
  INDEX lifecycle_idx (lifecycleState),
  INDEX readiness_idx (readinessScore)
);

CREATE TABLE IF NOT EXISTS intelligence_variants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  productId INT NOT NULL,
  variantId INT NOT NULL UNIQUE,
  inventoryReadiness INT DEFAULT 0 NOT NULL,
  variantMetadata JSON,
  lastInventorySync TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX product_idx (productId),
  INDEX variant_idx (variantId)
);

-- Insert sample products
INSERT INTO products (name, sku, description, price, createdAt, updatedAt)
VALUES 
  ('Bass Master Lure Collection', 'LURE-BASS-001', 'Professional bass fishing lure set with 12 proven patterns', 49.99, NOW(), NOW()),
  ('ProCast Fishing Line - 20lb Test', 'FISH-LINE-PRO-20LB', 'Premium braided fishing line, 300 yards, high visibility green', 29.99, NOW(), NOW()),
  ('Elite Tackle Storage System', 'TACKLE-BOX-ELITE', 'Waterproof tackle box with 8 adjustable compartments', 89.99, NOW(), NOW())
ON DUPLICATE KEY UPDATE updatedAt = NOW();

-- Insert intelligence_products data
INSERT INTO intelligence_products (productId, lifecycleState, readinessScore, intelligenceMetadata, variantSummary, lastIntelligenceUpdate)
SELECT 
  p.id,
  'concept',
  22,
  '{"requirements":[{"id":"req-1","title":"Product specifications finalized","status":"pending"}],"assets":[{"id":"asset-1","type":"product_image","status":"missing"}],"blockers":[{"id":"block-1","severity":"high","description":"Supplier negotiations pending"}]}',
  '{"totalVariants":0,"readyVariants":0}',
  NOW()
FROM products p
WHERE p.sku = 'LURE-BASS-001'
ON DUPLICATE KEY UPDATE lastIntelligenceUpdate = NOW();

INSERT INTO intelligence_products (productId, lifecycleState, readinessScore, intelligenceMetadata, variantSummary, lastIntelligenceUpdate)
SELECT 
  p.id,
  'development',
  65,
  '{"requirements":[{"id":"req-1","title":"Product specs","status":"complete"},{"id":"req-2","title":"Supplier confirmed","status":"complete"}],"assets":[{"id":"asset-1","type":"product_image","status":"ready"}],"blockers":[]}',
  '{"totalVariants":3,"readyVariants":2}',
  NOW()
FROM products p
WHERE p.sku = 'FISH-LINE-PRO-20LB'
ON DUPLICATE KEY UPDATE lastIntelligenceUpdate = NOW();

INSERT INTO intelligence_products (productId, lifecycleState, readinessScore, intelligenceMetadata, variantSummary, lastIntelligenceUpdate)
SELECT 
  p.id,
  'pre_launch',
  88,
  '{"requirements":[{"id":"req-1","title":"All specs complete","status":"complete"}],"assets":[{"id":"asset-1","type":"product_image","status":"ready"},{"id":"asset-2","type":"marketing_copy","status":"ready"}],"blockers":[]}',
  '{"totalVariants":1,"readyVariants":1}',
  NOW()
FROM products p
WHERE p.sku = 'TACKLE-BOX-ELITE'
ON DUPLICATE KEY UPDATE lastIntelligenceUpdate = NOW();

-- Insert launch missions
INSERT INTO launch_missions (productId, missionName, launchDatetime, status, settingsVersion, missionConfig, collaborators, currentPhase)
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

INSERT INTO launch_missions (productId, missionName, launchDatetime, status, settingsVersion, missionConfig, collaborators, currentPhase)
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
INSERT IGNORE INTO intelligence_settings (version, timingRules, thresholds, templates, createdBy)
VALUES (
  1,
  '{"assetDeadlineDays":30,"copyDeadlineDays":21,"freezeWindowDays":7,"goNoGoTimingDays":3,"reviewTimingDays":14,"escalationDelayHours":24,"syncFrequencyMinutes":60}',
  '{"inventoryThresholds":{"default":100},"safetyStockMultiplier":1.5,"variantReadinessMinScore":75,"minimumApprovalQuorum":2}',
  '{"defaultTasks":[],"defaultChecklists":[],"assetRequirements":[],"notificationRules":[],"phaseRequirements":[],"fallbackOwners":[]}',
  1
);

SELECT 'Intelligence Suite tables and sample data created successfully!' AS status;
