/**
 * Sync 10 products from WooCommerce to local database
 * Usage: node scripts/sync-woo-products.mjs
 */

import mysql from 'mysql2/promise';

// WooCommerce credentials from environment
const WOOCOMMERCE_STORE_URL = process.env.WOOCOMMERCE_STORE_URL || '';
const WOOCOMMERCE_CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY || '';
const WOOCOMMERCE_CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET || '';
const DATABASE_URL = process.env.DATABASE_URL || '';

if (!WOOCOMMERCE_STORE_URL || !WOOCOMMERCE_CONSUMER_KEY || !WOOCOMMERCE_CONSUMER_SECRET) {
  console.error('❌ Missing WooCommerce credentials in environment variables');
  console.error('Required: WOOCOMMERCE_STORE_URL, WOOCOMMERCE_CONSUMER_KEY, WOOCOMMERCE_CONSUMER_SECRET');
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error('❌ Missing DATABASE_URL in environment variables');
  process.exit(1);
}

console.log('🔄 Starting WooCommerce product sync...\n');

// Fetch products from WooCommerce
async function fetchWooCommerceProducts() {
  const auth = Buffer.from(`${WOOCOMMERCE_CONSUMER_KEY}:${WOOCOMMERCE_CONSUMER_SECRET}`).toString('base64');
  const url = `${WOOCOMMERCE_STORE_URL}/wp-json/wc/v3/products?per_page=10&status=publish`;
  
  console.log(`📡 Fetching products from: ${WOOCOMMERCE_STORE_URL}`);
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WooCommerce API error: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return response.json();
}

// Main sync function
async function syncProducts() {
  let connection;
  
  try {
    // Fetch products from WooCommerce
    const wooProducts = await fetchWooCommerceProducts();
    console.log(`✅ Fetched ${wooProducts.length} products from WooCommerce\n`);
    
    // Connect to database
    connection = await mysql.createConnection(DATABASE_URL);
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const wooProduct of wooProducts) {
      console.log(`\n📦 Processing: ${wooProduct.name}`);
      console.log(`   SKU: ${wooProduct.sku || 'N/A'}`);
      console.log(`   ID: ${wooProduct.id}`);
      
      // Use SKU as unique identifier, fallback to WooCommerce ID if no SKU
      const sku = wooProduct.sku || `WOO-${wooProduct.id}`;
      
      // Check if product already exists by SKU
      const [existing] = await connection.execute(
        `SELECT id FROM products WHERE sku = ?`,
        [sku]
      );
      
      // Extract price and cost
      const price = parseFloat(wooProduct.price) || 0;
      const regularPrice = parseFloat(wooProduct.regular_price) || price;
      const cost = price * 0.6; // Assume 40% margin if cost not available
      const margin = price - cost;
      
      // Extract category
      const category = wooProduct.categories && wooProduct.categories.length > 0 
        ? wooProduct.categories[0].name 
        : null;
      
      // Extract description (strip HTML tags)
      let description = wooProduct.description || wooProduct.short_description || null;
      if (description) {
        description = description.replace(/<[^>]*>/g, '').trim();
        if (description.length > 1000) {
          description = description.substring(0, 997) + '...';
        }
      }
      
      if (existing.length > 0) {
        // Update existing product
        await connection.execute(
          `UPDATE products SET 
            name = ?, 
            description = ?, 
            category = ?,
            price = ?, 
            cost = ?,
            margin = ?,
            isActive = ?
          WHERE sku = ?`,
          [
            wooProduct.name,
            description,
            category,
            price,
            cost,
            margin,
            wooProduct.status === 'publish' ? 1 : 0,
            sku
          ]
        );
        updated++;
        console.log(`   ✅ Updated existing product`);
      } else {
        // Insert new product
        await connection.execute(
          `INSERT INTO products (
            sku, name, description, category, price, cost, margin, isActive
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            sku,
            wooProduct.name,
            description,
            category,
            price,
            cost,
            margin,
            wooProduct.status === 'publish' ? 1 : 0
          ]
        );
        created++;
        console.log(`   ✅ Created new product`);
      }
    }
    
    console.log(`\n\n🎉 Sync complete!`);
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${wooProducts.length}\n`);
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
    console.error(error.stack);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

// Run sync
syncProducts();
