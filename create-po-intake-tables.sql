-- Create PO Intake System Tables
-- Based on Yazoo Mills Order #546337 workflow

-- 1. Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  customerNumber VARCHAR(100) COMMENT 'Our customer number in vendor system',
  contactName VARCHAR(255),
  contactEmail VARCHAR(320),
  contactPhone VARCHAR(50),
  address VARCHAR(500),
  city VARCHAR(100),
  state VARCHAR(50),
  zip VARCHAR(20),
  country VARCHAR(100) DEFAULT 'USA',
  website VARCHAR(500),
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_name (name),
  INDEX idx_customer_number (customerNumber)
);

-- 2. Vendor Contacts table
CREATE TABLE IF NOT EXISTS vendor_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendorId INT NOT NULL,
  firstName VARCHAR(255),
  lastName VARCHAR(255),
  email VARCHAR(320),
  phone VARCHAR(50),
  title VARCHAR(255),
  department VARCHAR(255),
  isPrimary BOOLEAN DEFAULT FALSE,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_vendor (vendorId),
  INDEX idx_email (email)
);

-- 3. Purchase Orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  poNumber VARCHAR(100) NOT NULL UNIQUE,
  vendorId INT NOT NULL,
  orderDate TIMESTAMP NOT NULL,
  shipDate TIMESTAMP,
  expectedDate TIMESTAMP,
  receivedDate TIMESTAMP,
  status VARCHAR(100) DEFAULT 'pending',
  subtotal INT NOT NULL COMMENT 'Cents',
  shippingCost INT DEFAULT 0 COMMENT 'Cents',
  tax INT DEFAULT 0 COMMENT 'Cents',
  totalAmount INT NOT NULL COMMENT 'Cents',
  paymentMethod VARCHAR(100),
  paymentStatus VARCHAR(50) DEFAULT 'unpaid',
  paidDate TIMESTAMP,
  shipToName VARCHAR(255),
  shipToAddress VARCHAR(500),
  shipToCity VARCHAR(100),
  shipToState VARCHAR(50),
  shipToZip VARCHAR(20),
  shipToCountry VARCHAR(100) DEFAULT 'USA',
  notes TEXT,
  internalNotes TEXT,
  emailThreadId VARCHAR(255),
  createdBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_po_number (poNumber),
  INDEX idx_vendor (vendorId),
  INDEX idx_status (status),
  INDEX idx_order_date (orderDate)
);

-- 4. PO Line Items table
CREATE TABLE IF NOT EXISTS po_line_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  poId INT NOT NULL,
  productId INT,
  sku VARCHAR(100),
  productName VARCHAR(500) NOT NULL,
  description TEXT,
  quantity INT NOT NULL,
  receivedQuantity INT DEFAULT 0 NOT NULL,
  quantityAccepted INT DEFAULT 0,
  quantityRejected INT DEFAULT 0,
  unitCost INT NOT NULL COMMENT 'Cents',
  extendedPrice INT NOT NULL COMMENT 'Cents',
  verified BOOLEAN DEFAULT FALSE,
  verifiedBy INT,
  verifiedAt TIMESTAMP,
  discrepancyNotes TEXT,
  lineNumber INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_po (poId),
  INDEX idx_sku (sku),
  INDEX idx_product (productId)
);

-- 5. Shipments table
CREATE TABLE IF NOT EXISTS shipments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  poId INT NOT NULL,
  trackingNumber VARCHAR(100) NOT NULL UNIQUE,
  bolNumber VARCHAR(100) COMMENT 'Bill of Lading number',
  packSlipNumber VARCHAR(100),
  carrier VARCHAR(255) NOT NULL,
  service VARCHAR(100),
  shipDate TIMESTAMP NOT NULL,
  deliveryDate TIMESTAMP,
  expectedDeliveryDate TIMESTAMP,
  status VARCHAR(100) DEFAULT 'pending',
  weight INT COMMENT 'Pounds',
  totalPallets INT,
  totalCartons INT,
  freightClass VARCHAR(50),
  specialInstructions TEXT,
  packageDescription TEXT,
  freightTerms VARCHAR(100),
  trackingUrl VARCHAR(500),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_tracking (trackingNumber),
  INDEX idx_bol (bolNumber),
  INDEX idx_po (poId),
  INDEX idx_status (status)
);

-- 6. Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  poId INT NOT NULL,
  invoiceNumber VARCHAR(100) NOT NULL UNIQUE,
  invoiceDate TIMESTAMP NOT NULL,
  dueDate TIMESTAMP,
  subtotal INT NOT NULL COMMENT 'Cents',
  tax INT DEFAULT 0 COMMENT 'Cents',
  shipping INT DEFAULT 0 COMMENT 'Cents',
  miscCharges INT DEFAULT 0 COMMENT 'Cents',
  totalAmount INT NOT NULL COMMENT 'Cents',
  paymentMethod VARCHAR(100),
  paymentTerms VARCHAR(100),
  paymentStatus VARCHAR(50) DEFAULT 'unpaid',
  paidDate TIMESTAMP,
  paidAmount INT DEFAULT 0 COMMENT 'Cents',
  invoicePdfUrl VARCHAR(500),
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_invoice_number (invoiceNumber),
  INDEX idx_po (poId),
  INDEX idx_payment_status (paymentStatus)
);

-- 7. Receiving Logs table
CREATE TABLE IF NOT EXISTS receiving_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  poId INT NOT NULL,
  lineItemId INT,
  shipmentId INT,
  receivedDate TIMESTAMP NOT NULL,
  quantityReceived INT NOT NULL,
  receivedBy INT NOT NULL,
  condition VARCHAR(50) DEFAULT 'good',
  hasDiscrepancies BOOLEAN DEFAULT FALSE,
  discrepancyType VARCHAR(100),
  discrepancyNotes TEXT,
  photoUrls TEXT COMMENT 'JSON array',
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_po (poId),
  INDEX idx_shipment (shipmentId),
  INDEX idx_received_date (receivedDate)
);

SELECT 'PO intake tables created successfully' AS status;
