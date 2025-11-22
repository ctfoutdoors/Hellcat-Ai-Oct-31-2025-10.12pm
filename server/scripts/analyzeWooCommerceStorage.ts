import { ENV } from '../_core/env';

async function analyzeWooCommerceStorage() {
  const storeUrl = ENV.woocommerceStoreUrl;
  const consumerKey = ENV.woocommerceConsumerKey;
  const consumerSecret = ENV.woocommerceConsumerSecret;

  if (!storeUrl || !consumerKey || !consumerSecret) {
    console.error('WooCommerce credentials not configured');
    return;
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  
  // Fetch sample of 10 recent orders
  const response = await fetch(`${storeUrl}/wp-json/wc/v3/orders?per_page=10&orderby=date&order=desc`, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    console.error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
    return;
  }

  const orders = await response.json();
  
  if (!Array.isArray(orders) || orders.length === 0) {
    console.log('No orders found');
    return;
  }

  console.log(`\n=== WooCommerce Storage Analysis ===`);
  console.log(`Sample size: ${orders.length} orders\n`);

  // Calculate JSON size
  const jsonString = JSON.stringify(orders);
  const jsonSizeBytes = Buffer.byteLength(jsonString, 'utf8');
  const avgJsonSizePerOrder = jsonSizeBytes / orders.length;

  console.log(`JSON Storage:`);
  console.log(`  Total sample size: ${(jsonSizeBytes / 1024).toFixed(2)} KB`);
  console.log(`  Average per order: ${(avgJsonSizePerOrder / 1024).toFixed(2)} KB`);
  console.log(`  Estimated for 65,000 orders: ${((avgJsonSizePerOrder * 65000) / (1024 * 1024)).toFixed(2)} MB\n`);

  // Analyze order structure
  const sampleOrder = orders[0];
  const lineItemsCount = sampleOrder.line_items?.length || 0;
  const metaDataCount = sampleOrder.meta_data?.length || 0;

  console.log(`Order Structure (sample):`);
  console.log(`  Line items per order: ${lineItemsCount}`);
  console.log(`  Meta data entries: ${metaDataCount}`);
  console.log(`  Total fields: ${Object.keys(sampleOrder).length}\n`);

  // Estimate database storage
  // Rough estimate: each order row ~2KB, each line item ~500 bytes, each meta ~200 bytes
  const avgDbSizePerOrder = 2048 + (lineItemsCount * 500) + (metaDataCount * 200);
  
  console.log(`Database Storage Estimate:`);
  console.log(`  Average per order (with relations): ${(avgDbSizePerOrder / 1024).toFixed(2)} KB`);
  console.log(`  Estimated for 65,000 orders: ${((avgDbSizePerOrder * 65000) / (1024 * 1024)).toFixed(2)} MB\n`);

  // Total estimate
  const totalBytes = (avgJsonSizePerOrder + avgDbSizePerOrder) * 65000;
  console.log(`Total Storage Estimate (JSON + Database):`);
  console.log(`  ${(totalBytes / (1024 * 1024)).toFixed(2)} MB (${(totalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB)\n`);

  // Breakdown by component
  console.log(`Component Breakdown for 65,000 orders:`);
  console.log(`  Orders table: ~${((2048 * 65000) / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`  Line items: ~${((lineItemsCount * 500 * 65000) / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`  Metadata: ~${((metaDataCount * 200 * 65000) / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`  JSON cache/backup: ~${((avgJsonSizePerOrder * 65000) / (1024 * 1024)).toFixed(2)} MB\n`);
}

analyzeWooCommerceStorage().catch(console.error);
