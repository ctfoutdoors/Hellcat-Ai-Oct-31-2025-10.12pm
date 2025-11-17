-- Populate PO Intake System with Yazoo Mills Order #546337
-- Based on actual documents: BOL #167533, Invoice #555529

-- 1. Insert Yazoo Mills as vendor
INSERT INTO vendors (
  name, customerNumber, contactName, contactEmail, contactPhone,
  address, city, state, zip, country, website
) VALUES (
  'Yazoo Mills Inc',
  'Q3854',
  'Mya Scott',
  'mscott@yazoomills.com',
  '717-624-8993',
  '305 Commerce St',
  'New Oxford',
  'PA',
  '17350',
  'USA',
  'https://yazoomills.com'
);

SET @vendorId = LAST_INSERT_ID();

-- 2. Insert vendor contacts
INSERT INTO vendor_contacts (vendorId, firstName, lastName, email, title, isPrimary) VALUES
(@vendorId, 'Mya', 'Scott', 'mscott@yazoomills.com', 'Customer Service', TRUE),
(@vendorId, 'Cheryl', 'Brown', 'CBrown@yazoomills.com', 'Orders', FALSE);

-- 3. Insert Purchase Order #546337
INSERT INTO purchase_orders (
  poNumber, vendorId, orderDate, shipDate, expectedDate,
  status, subtotal, shippingCost, tax, totalAmount,
  paymentMethod, paymentStatus,
  shipToName, shipToAddress, shipToCity, shipToState, shipToZip, shipToCountry,
  notes
) VALUES (
  '546337',
  @vendorId,
  '2025-11-12 00:00:00',  -- Order date from email
  '2025-11-14 00:00:00',  -- Ship date from BOL
  '2025-11-18 00:00:00',  -- Expected delivery from BOL
  'delivered',
  631000,  -- $6,310.00 in cents
  71787,   -- $717.87 shipping in cents
  22500,   -- $225.00 tax in cents (estimated)
  725287,  -- $7,252.87 total in cents
  'Credit Card',
  'paid',
  'Catch The Fever',
  '3 Catch The Fever Lane',
  'Byhalia',
  'MS',
  '38611',
  'USA',
  'Shipping tubes order - 4 SKUs'
);

SET @poId = LAST_INSERT_ID();

-- 4. Insert PO Line Items (4 SKUs from invoice)
INSERT INTO po_line_items (
  poId, sku, productName, description, quantity, receivedQuantity,
  unitCost, extendedPrice, lineNumber, verified
) VALUES
-- Line 1: 2" x 9" tubes
(@poId, 'RT2X9', '2" x 9" Shipping Tube', '2 inch diameter x 9 inch length shipping tube', 
 1000, 1000, 90, 90000, 1, TRUE),

-- Line 2: 3" x 9" tubes  
(@poId, 'RT3X9', '3" x 9" Shipping Tube', '3 inch diameter x 9 inch length shipping tube',
 1000, 1000, 140, 140000, 2, TRUE),

-- Line 3: 5" x 9" tubes
(@poId, 'RT5X9', '5" x 9" Shipping Tube', '5 inch diameter x 9 inch length shipping tube',
 500, 500, 310, 155000, 3, TRUE),

-- Line 4: 6" x 9" tubes
(@poId, 'RT6X9', '6" x 9" Shipping Tube', '6 inch diameter x 9 inch length shipping tube',
 500, 500, 452, 226000, 4, TRUE);

-- 5. Insert Shipment (BOL #167533)
INSERT INTO shipments (
  poId, trackingNumber, bolNumber, carrier, shipDate, expectedDeliveryDate,
  status, totalPallets, totalCartons, freightClass, packageDescription, freightTerms
) VALUES (
  @poId,
  '167533',  -- BOL number used as tracking
  '167533',
  'Geile Trucking',
  '2025-11-14 00:00:00',
  '2025-11-18 00:00:00',
  'delivered',
  2,  -- Estimated pallets for 3000 tubes
  4,  -- 4 different SKUs
  '100',
  'Shipping tubes - various sizes (2", 3", 5", 6" diameter)',
  'Prepaid'
);

SET @shipmentId = LAST_INSERT_ID();

-- 6. Insert Invoice #555529
INSERT INTO invoices (
  poId, invoiceNumber, invoiceDate, dueDate,
  subtotal, tax, shipping, totalAmount,
  paymentTerms, paymentStatus, paidDate
) VALUES (
  @poId,
  '555529',
  '2025-11-14 00:00:00',
  '2025-12-14 00:00:00',  -- 30 days net
  631000,  -- $6,310.00
  22500,   -- $225.00 tax (estimated)
  71787,   -- $717.87 shipping
  725287,  -- $7,252.87 total
  'Net 30',
  'paid',
  '2025-11-20 00:00:00'
);

-- 7. Insert Receiving Logs
INSERT INTO receiving_logs (
  poId, shipmentId, receivedDate, quantityReceived, receivedBy,
  condition, hasDiscrepancies, notes
) VALUES
(@poId, @shipmentId, '2025-11-18 10:30:00', 3000, 1, 'good', FALSE, 
 'All 4 SKUs received in good condition. Verified quantities match invoice.');

SELECT 
  'Yazoo Mills Order #546337 populated successfully' AS status,
  @vendorId AS vendorId,
  @poId AS poId,
  @shipmentId AS shipmentId;
