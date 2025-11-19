import { createWooCommerceClient } from './server/integrations/woocommerce.ts';
import { downloadAndUploadImage } from './server/lib/imageSync.ts';
import { getDb } from './server/db.ts';
import { products } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

async function testImageSync() {
  console.log('Testing image sync for one product...');
  
  const wooClient = createWooCommerceClient();
  if (!wooClient) {
    console.error('WooCommerce client not configured');
    return;
  }

  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    return;
  }

  // Get one product with WOO- SKU
  const testProducts = await db
    .select()
    .from(products)
    .where(eq(products.sku, 'WOO-87144'))
    .limit(1);

  if (testProducts.length === 0) {
    console.error('No test product found');
    return;
  }

  const product = testProducts[0];
  console.log(`Testing with product: ${product.sku} - ${product.name}`);

  // Extract WooCommerce ID
  const wooProductId = parseInt(product.sku.replace('WOO-', ''));
  console.log(`WooCommerce Product ID: ${wooProductId}`);

  // Fetch from WooCommerce
  const response = await wooClient.request(`/products/${wooProductId}`);
  console.log(`Product data fetched:`, {
    name: response.name,
    images: response.images?.length || 0,
    firstImageUrl: response.images?.[0]?.src
  });

  if (!response?.images?.[0]?.src) {
    console.error('No image found for product');
    return;
  }

  // Download and upload image
  const imageUrl = response.images[0].src;
  console.log(`Downloading image from: ${imageUrl}`);
  
  const s3Url = await downloadAndUploadImage(imageUrl, product.sku);
  console.log(`Image uploaded to S3: ${s3Url}`);

  if (s3Url) {
    await db.update(products)
      .set({ imageUrl: s3Url })
      .where(eq(products.id, product.id));
    console.log('✅ Product updated with image URL');
  } else {
    console.error('❌ Failed to upload image');
  }
}

testImageSync().catch(console.error);
