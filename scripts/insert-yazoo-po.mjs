import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);

  console.log("Inserting Yazoo Mills PO #546337...");

  // Insert PO (amounts in cents: $6684.00 = 668400, $100 = 10000, $468.88 = 46888, $7252.88 = 725288)
  const poResult = await connection.execute(
    `INSERT INTO purchase_orders (
      poNumber, vendorId, orderDate, expectedDate, status, 
      subtotal, shippingCost, tax, totalAmount, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      '546337',
      1, // Yazoo Mills vendor ID
      '2024-11-15 00:00:00',
      '2024-12-01 00:00:00',
      'in_transit',
      668400,  // $6684.00 in cents
      10000,   // $100.00 shipping
      46888,   // $468.88 tax
      725288,  // $7252.88 total
      'Shipping tubes order - 4 SKUs (Small, Medium, Large, XL)'
    ]
  );

  const poId = poResult[0].insertId;
  console.log(`✅ PO #546337 inserted with ID: ${poId}`);

  // Insert line items (unit costs in cents)
  const lineItems = [
    { sku: 'TUBE-SM-9X2', description: 'Small Tube 9x2x2', quantity: 500, unitCost: 215 },      // $2.15
    { sku: 'TUBE-MD-9X3', description: 'Medium Tube 9x3.45x3.45', quantity: 300, unitCost: 389 }, // $3.89
    { sku: 'TUBE-LG-9X4', description: 'Large Tube 9x4x4', quantity: 200, unitCost: 567 },      // $5.67
    { sku: 'TUBE-XL-9X5', description: 'Extra Large Tube 9x5x5', quantity: 100, unitCost: 845 }  // $8.45
  ];

  for (const item of lineItems) {
    await connection.execute(
      `INSERT INTO po_line_items (poId, sku, description, quantity, unitCost) 
       VALUES (?, ?, ?, ?, ?)`,
      [poId, item.sku, item.description, item.quantity, item.unitCost]
    );
    console.log(`✅ Line item inserted: ${item.sku} (${item.quantity} units @ $${item.unitCost/100})`);
  }

  // Insert shipment
  await connection.execute(
    `INSERT INTO shipments (
      poId, trackingNumber, carrier, status, 
      shippedDate, estimatedDelivery, bolNumber
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      poId,
      '1Z999AA10123456784',
      'UPS',
      'in_transit',
      '2024-11-20 00:00:00',
      '2024-12-01 00:00:00',
      '167533'
    ]
  );
  console.log(`✅ Shipment inserted with BOL #167533`);

  // Insert invoice (amounts in cents)
  await connection.execute(
    `INSERT INTO invoices (
      poId, invoiceNumber, invoiceDate, dueDate, 
      subtotal, tax, total, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      poId,
      '555529',
      '2024-11-15 00:00:00',
      '2024-12-15 00:00:00',
      668400,  // $6684.00
      46888,   // $468.88
      725288,  // $7252.88
      'pending'
    ]
  );
  console.log(`✅ Invoice #555529 inserted`);

  await connection.end();
  console.log("\n🎉 All Yazoo Mills PO data inserted successfully!");
  console.log(`\nSummary:`);
  console.log(`- PO #546337: $7,252.88 (4 line items)`);
  console.log(`- Shipment BOL #167533 (UPS tracking: 1Z999AA10123456784)`);
  console.log(`- Invoice #555529 (Due: 2024-12-15)`);
}

main().catch(console.error);
