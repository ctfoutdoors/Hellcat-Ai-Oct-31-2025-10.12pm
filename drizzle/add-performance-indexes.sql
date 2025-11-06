-- Performance Optimization: Add indexes for frequently queried fields

-- Cases table indexes
CREATE INDEX IF NOT EXISTS idx_cases_tracking_number ON cases(tracking_number);
CREATE INDEX IF NOT EXISTS idx_cases_carrier ON cases(carrier);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_created_by ON cases(created_by);
CREATE INDEX IF NOT EXISTS idx_cases_ship_date ON cases(ship_date);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_cases_status_priority ON cases(status, priority);
CREATE INDEX IF NOT EXISTS idx_cases_carrier_status ON cases(carrier, status);
CREATE INDEX IF NOT EXISTS idx_cases_created_at_status ON cases(created_at DESC, status);

-- Attachments table indexes
CREATE INDEX IF NOT EXISTS idx_attachments_case_id ON attachments(case_id);
CREATE INDEX IF NOT EXISTS idx_attachments_type ON attachments(type);

-- Certifications table indexes
CREATE INDEX IF NOT EXISTS idx_certifications_product_name ON certifications(product_name);
CREATE INDEX IF NOT EXISTS idx_certifications_manufacturer ON certifications(manufacturer);

-- Products table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Email template settings
CREATE INDEX IF NOT EXISTS idx_email_template_settings_user_id ON email_template_settings(user_id);

-- Comments: These indexes will significantly improve query performance for:
-- 1. Searching cases by tracking number
-- 2. Filtering by carrier, status, priority
-- 3. Sorting by creation date
-- 4. Loading case attachments
-- 5. Looking up certifications
