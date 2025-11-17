-- Enhance existing tables for PO intake system
-- Based on Yazoo Mills Order #546337 analysis

-- 1. Add vendor customer number to vendors table
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS customerNumber VARCHAR(100) COMMENT 'Our customer number in vendor system (e.g., Q3854)';

-- 2. Add BOL tracking and PO link to shipments table
ALTER TABLE shipments 
ADD COLUMN IF NOT EXISTS poId INT COMMENT 'Link to purchase order',
ADD COLUMN IF NOT EXISTS bolNumber VARCHAR(100) COMMENT 'Bill of Lading number',
ADD COLUMN IF NOT EXISTS packSlipNumber VARCHAR(100) COMMENT 'Pack slip number',
ADD COLUMN IF NOT EXISTS totalPallets INT COMMENT 'Number of pallets',
ADD COLUMN IF NOT EXISTS totalCartons INT COMMENT 'Number of cartons',
ADD COLUMN IF NOT EXISTS freightClass VARCHAR(50) COMMENT 'Freight class (e.g., 100)',
ADD COLUMN IF NOT EXISTS specialInstructions TEXT COMMENT 'Special handling instructions',
ADD COLUMN IF NOT EXISTS packageDescription TEXT COMMENT 'Description of package contents',
ADD COLUMN IF NOT EXISTS freightTerms VARCHAR(100) COMMENT 'Prepaid, Collect, etc.';

-- 3. Add PO link and payment details to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS poId INT COMMENT 'Link to purchase order',
ADD COLUMN IF NOT EXISTS paymentMethod VARCHAR(100) COMMENT 'Credit card, check, etc.',
ADD COLUMN IF NOT EXISTS paymentTerms VARCHAR(100) COMMENT 'Payment terms',
ADD COLUMN IF NOT EXISTS subtotal INT COMMENT 'Subtotal in cents',
ADD COLUMN IF NOT EXISTS tax INT COMMENT 'Tax in cents',
ADD COLUMN IF NOT EXISTS shipping INT COMMENT 'Shipping cost in cents',
ADD COLUMN IF NOT EXISTS miscCharges INT COMMENT 'Misc charges in cents',
ADD COLUMN IF NOT EXISTS invoicePdfUrl VARCHAR(500) COMMENT 'URL to invoice PDF document';

-- 4. Add vendor link and enhanced fields to purchase_orders table
ALTER TABLE purchase_orders 
ADD COLUMN IF NOT EXISTS vendorId INT COMMENT 'Link to vendor',
ADD COLUMN IF NOT EXISTS shipDate TIMESTAMP COMMENT 'Actual ship date',
ADD COLUMN IF NOT EXISTS paymentMethod VARCHAR(100) COMMENT 'Payment method used',
ADD COLUMN IF NOT EXISTS paymentStatus VARCHAR(50) COMMENT 'Payment status',
ADD COLUMN IF NOT EXISTS paidDate TIMESTAMP COMMENT 'Date payment was made',
ADD COLUMN IF NOT EXISTS shipToName VARCHAR(255) COMMENT 'Ship to contact name',
ADD COLUMN IF NOT EXISTS shipToAddress VARCHAR(500) COMMENT 'Ship to street address',
ADD COLUMN IF NOT EXISTS shipToCity VARCHAR(100) COMMENT 'Ship to city',
ADD COLUMN IF NOT EXISTS shipToState VARCHAR(50) COMMENT 'Ship to state',
ADD COLUMN IF NOT EXISTS shipToZip VARCHAR(20) COMMENT 'Ship to ZIP code',
ADD COLUMN IF NOT EXISTS shipToCountry VARCHAR(100) DEFAULT 'USA' COMMENT 'Ship to country',
ADD COLUMN IF NOT EXISTS emailThreadId VARCHAR(255) COMMENT 'Link to email conversation',
ADD COLUMN IF NOT EXISTS internalNotes TEXT COMMENT 'Internal notes not visible to vendor';

-- 5. Add enhanced verification fields to po_line_items table
ALTER TABLE po_line_items 
ADD COLUMN IF NOT EXISTS productName VARCHAR(500) COMMENT 'Full product name/description',
ADD COLUMN IF NOT EXISTS quantityAccepted INT DEFAULT 0 COMMENT 'Quantity accepted during receiving',
ADD COLUMN IF NOT EXISTS quantityRejected INT DEFAULT 0 COMMENT 'Quantity rejected during receiving',
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE COMMENT 'Line item verified flag',
ADD COLUMN IF NOT EXISTS verifiedBy INT COMMENT 'User ID who verified',
ADD COLUMN IF NOT EXISTS verifiedAt TIMESTAMP COMMENT 'Verification timestamp',
ADD COLUMN IF NOT EXISTS discrepancyNotes TEXT COMMENT 'Notes about discrepancies',
ADD COLUMN IF NOT EXISTS lineNumber INT COMMENT 'Order of line items in PO';

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendors_customer_number ON vendors(customerNumber);
CREATE INDEX IF NOT EXISTS idx_shipments_bol_number ON shipments(bolNumber);
CREATE INDEX IF NOT EXISTS idx_shipments_po_id ON shipments(poId);
CREATE INDEX IF NOT EXISTS idx_invoices_po_id ON invoices(poId);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor_id ON purchase_orders(vendorId);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_email_thread ON purchase_orders(emailThreadId);

-- 7. Add foreign key constraints (if not exists)
-- Note: MySQL doesn't support IF NOT EXISTS for foreign keys, so we'll skip this for now
-- These can be added manually after verifying the data integrity

SELECT 'PO intake table enhancements completed successfully' AS status;
