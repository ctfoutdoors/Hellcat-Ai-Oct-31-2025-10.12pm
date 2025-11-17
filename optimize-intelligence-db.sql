-- Intelligence Suite Database Optimization Migration
-- Adds critical indexes, foreign keys, and performance enhancements

-- ============================================================================
-- PHASE 1: Add Missing Indexes
-- ============================================================================

-- Product Intelligence indexes
CREATE INDEX IF NOT EXISTS idx_intel_lifecycle_state ON intelligence_products(lifecycle_state);
CREATE INDEX IF NOT EXISTS idx_intel_readiness_score ON intelligence_products(readiness_score);
CREATE INDEX IF NOT EXISTS idx_intel_product_id ON intelligence_products(product_id);

-- Launch Orchestrator indexes
CREATE INDEX IF NOT EXISTS idx_mission_status ON launch_missions(status);
CREATE INDEX IF NOT EXISTS idx_mission_launch_datetime ON launch_missions(launch_datetime);
CREATE INDEX IF NOT EXISTS idx_mission_product_id ON launch_missions(product_id);

-- Variant Intelligence indexes
CREATE INDEX IF NOT EXISTS idx_variant_product_id ON intelligence_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variant_variant_id ON intelligence_variants(variant_id);

-- ============================================================================
-- PHASE 2: Add Foreign Key Constraints
-- ============================================================================

-- Intelligence products → main products (CASCADE delete)
ALTER TABLE intelligence_products 
ADD CONSTRAINT fk_intel_product 
FOREIGN KEY (product_id) REFERENCES products(id) 
ON DELETE CASCADE;

-- Launch missions → main products (SET NULL to preserve history)
ALTER TABLE launch_missions
ADD CONSTRAINT fk_mission_product
FOREIGN KEY (product_id) REFERENCES products(id)
ON DELETE SET NULL;

-- Intelligence variants → main variants (CASCADE delete)
ALTER TABLE intelligence_variants
ADD CONSTRAINT fk_intel_variant
FOREIGN KEY (variant_id) REFERENCES product_variants(id)
ON DELETE CASCADE;

-- ============================================================================
-- PHASE 3: Add Cached Readiness Score Column
-- ============================================================================

-- Add cached readiness score for performance
ALTER TABLE intelligence_products 
ADD COLUMN IF NOT EXISTS readiness_score_cached INT DEFAULT 0;

ALTER TABLE intelligence_products
ADD COLUMN IF NOT EXISTS readiness_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Create index on cached score
CREATE INDEX IF NOT EXISTS idx_readiness_cached ON intelligence_products(readiness_score_cached);

-- ============================================================================
-- PHASE 4: Add Computed Columns for JSON Queries (MySQL 5.7+)
-- ============================================================================

-- Note: Generated columns require MySQL 5.7+ or MariaDB 10.2+
-- If your database doesn't support this, comment out this section

ALTER TABLE intelligence_products
ADD COLUMN IF NOT EXISTS requirements_count INT GENERATED ALWAYS AS (
  JSON_LENGTH(COALESCE(intelligence_metadata->'$.requirements', '[]'))
) STORED;

ALTER TABLE intelligence_products
ADD COLUMN IF NOT EXISTS assets_count INT GENERATED ALWAYS AS (
  JSON_LENGTH(COALESCE(intelligence_metadata->'$.assets', '[]'))
) STORED;

ALTER TABLE intelligence_products
ADD COLUMN IF NOT EXISTS blockers_count INT GENERATED ALWAYS AS (
  JSON_LENGTH(COALESCE(intelligence_metadata->'$.blockers', '[]'))
) STORED;

-- Create indexes on computed columns
CREATE INDEX IF NOT EXISTS idx_requirements_count ON intelligence_products(requirements_count);
CREATE INDEX IF NOT EXISTS idx_blockers_count ON intelligence_products(blockers_count);

-- ============================================================================
-- PHASE 5: Initialize Cached Readiness Scores
-- ============================================================================

-- Copy current readiness scores to cached column
UPDATE intelligence_products 
SET readiness_score_cached = readiness_score,
    readiness_updated_at = NOW()
WHERE readiness_score_cached = 0;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check indexes were created
SHOW INDEX FROM intelligence_products;
SHOW INDEX FROM launch_missions;
SHOW INDEX FROM intelligence_variants;

-- Check foreign keys were created
SELECT 
  TABLE_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('intelligence_products', 'launch_missions', 'intelligence_variants')
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Check computed columns were created
SHOW COLUMNS FROM intelligence_products LIKE '%_count';

-- Performance test: Query with indexes
EXPLAIN SELECT * FROM intelligence_products WHERE lifecycle_state = 'development';
EXPLAIN SELECT * FROM launch_missions WHERE status = 'active';
