/**
 * Script to find the eBay channel ID from ShipStation
 */

const apiKey = process.env.Shipstation_API_PK;
const apiSecret = process.env.Shipstation_API_Secret;

if (!apiKey || !apiSecret) {
  console.error('❌ ShipStation credentials not found in environment');
  process.exit(1);
}

const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

try {
  console.log('🔍 Fetching ShipStation stores...\n');
  
  const response = await fetch('https://ssapi.shipstation.com/stores', {
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`ShipStation API error: ${response.status} ${response.statusText}`);
  }

  const stores = await response.json();
  
  console.log(`✅ Found ${stores.length} stores:\n`);
  
  stores.forEach((store) => {
    console.log(`📦 Store: ${store.storeName}`);
    console.log(`   Store ID: ${store.storeId}`);
    console.log(`   Marketplace: ${store.marketplaceName}`);
    console.log(`   Active: ${store.active}`);
    console.log('');
  });
  
  // Find the eBay store
  const ebayStore = stores.find(s => s.storeName === 'New eBay Store');
  
  if (ebayStore) {
    console.log('🎯 Found "New eBay Store":');
    console.log(`   Store ID: ${ebayStore.storeId}`);
    console.log(`   Marketplace ID: ${ebayStore.marketplaceId}`);
    console.log(`   Marketplace Name: ${ebayStore.marketplaceName}`);
  } else {
    console.log('⚠️  "New eBay Store" not found in stores list');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
