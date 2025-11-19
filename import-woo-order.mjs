import 'dotenv/config';
import mysql from 'mysql2/promise';
import axios from 'axios';

const WOOCOMMERCE_STORE_URL = process.env.WOOCOMMERCE_STORE_URL;
const WOOCOMMERCE_CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY;
const WOOCOMMERCE_CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET;

if (!WOOCOMMERCE_STORE_URL || !WOOCOMMERCE_CONSUMER_KEY || !WOOCOMMERCE_CONSUMER_SECRET) {
  console.error('Missing WooCommerce credentials');
  process.exit(1);
}

// Connect to database
const db = await mysql.createConnection(process.env.DATABASE_URL);

console.log('Fetching latest processing order from WooCommerce...');

// Fetch latest processing order
const response = await axios.get(`${WOOCOMMERCE_STORE_URL}/wp-json/wc/v3/orders`, {
  auth: {
    username: WOOCOMMERCE_CONSUMER_KEY,
    password: WOOCOMMERCE_CONSUMER_SECRET,
  },
  params: {
    status: 'processing',
    orderby: 'date',
    order: 'desc',
    per_page: 1,
  },
});

if (response.data.length === 0) {
  console.log('No processing orders found in WooCommerce');
  process.exit(0);
}

const wooOrder = response.data[0];
console.log(`Found order #${wooOrder.id}: ${wooOrder.billing.first_name} ${wooOrder.billing.last_name}`);
console.log(`  Total: $${wooOrder.total}`);
console.log(`  Date: ${wooOrder.date_created}`);
console.log(`  Status: ${wooOrder.status}`);

// Insert into database
const orderData = {
  orderNumber: `WOO-${wooOrder.id}`,
  source: 'WooCommerce',
  channel: 'Website CTF',
  externalId: wooOrder.id.toString(),
  customerName: `${wooOrder.billing.first_name} ${wooOrder.billing.last_name}`.trim(),
  customerEmail: wooOrder.billing.email,
  status: wooOrder.status,
  paymentStatus: wooOrder.date_paid ? 'paid' : 'pending',
  shippingStatus: wooOrder.date_completed ? 'shipped' : 'not_shipped',
  totalAmount: parseFloat(wooOrder.total),
  currency: wooOrder.currency,
  orderDate: new Date(wooOrder.date_created),
  shippingMethod: wooOrder.shipping_lines[0]?.method_title || null,
  notes: wooOrder.customer_note || null,
};

await db.execute(
  `INSERT INTO orders (orderNumber, source, channel, externalId, customerName, customerEmail, status, paymentStatus, shippingStatus, totalAmount, currency, orderDate, shippingMethod, notes)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    orderData.orderNumber,
    orderData.source,
    orderData.channel,
    orderData.externalId,
    orderData.customerName,
    orderData.customerEmail,
    orderData.status,
    orderData.paymentStatus,
    orderData.shippingStatus,
    orderData.totalAmount,
    orderData.currency,
    orderData.orderDate,
    orderData.shippingMethod,
    orderData.notes,
  ]
);

console.log(`✅ Successfully imported order ${orderData.orderNumber}`);

await db.end();
