import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { products } from '../drizzle/schema.ts';
import { createWooCommerceClient } from '../server/integrations/woocommerce.ts';
import { syncProductImage } from '../server/lib/imageSync.ts';

const db = drizzle(process.env.DATABASE_URL);
const wooClient = createWooCommerceClient();

if (!wooClient) {
  console.error('❌ WooCommerce client not configured');
  process.exit(1);
}

async function importAllProductImages() {
  console.log('🖼️  Starting product image import...\n');

  // Get all products from database
  const allProducts = await db.select().from(products);
  console.log(`Found ${allProducts.length} products in database\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const product of allProducts) {
    try {
      // Skip if already has image
      if (product.imageUrl) {
        console.log(`⏭️  Skipping ${product.sku} - already has image`);
        skipCount++;
        continue;
      }

      // Get WooCommerce product ID from SKU or product data
      let wooProductId = null;
      
      // Try to extract from SKU if it starts with WOO-
      if (product.sku?.startsWith('WOO-')) {
        wooProductId = parseInt(product.sku.replace('WOO-', ''));
      }

      if (!wooProductId) {
        console.log(`⚠️  Skipping ${product.sku} - no WooCommerce ID found`);
        skipCount++;
        continue;
      }

      // Fetch product from WooCommerce
      console.log(`📥 Fetching ${product.sku} (WC ID: ${wooProductId})...`);
      const wooProduct = await wooClient.get(`products/${wooProductId}`);

      if (!wooProduct.data?.images?.[0]?.src) {
        console.log(`⚠️  No image found for ${product.sku}`);
        skipCount++;
        continue;
      }

      const imageUrl = wooProduct.data.images[0].src;
      console.log(`🖼️  Downloading and uploading image...`);

      // Download and upload to S3
      const s3Url = await syncProductImage(imageUrl, product.sku);

      if (s3Url) {
        // Update product with image URL
        await db.update(products)
          .set({ imageUrl: s3Url })
          .where(eq(products.id, product.id));

        console.log(`✅ ${product.sku} - Image imported successfully\n`);
        successCount++;
      } else {
        console.log(`❌ ${product.sku} - Failed to upload image\n`);
        errorCount++;
      }

      // Rate limit: wait 500ms between requests
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`❌ Error processing ${product.sku}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 Import Summary:');
  console.log(`✅ Success: ${successCount}`);
  console.log(`⏭️  Skipped: ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📦 Total: ${allProducts.length}`);
}

importAllProductImages()
  .then(() => {
    console.log('\n✅ Image import complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
