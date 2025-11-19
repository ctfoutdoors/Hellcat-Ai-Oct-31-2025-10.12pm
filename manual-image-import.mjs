import { createWooCommerceClient } from './server/integrations/woocommerce.ts';
import { downloadAndUploadImage } from './server/lib/imageSync.ts';
import { drizzle } from 'drizzle-orm/mysql2';
import { products } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);
const woo = createWooCommerceClient();

if (!woo) {
  console.error('WooCommerce client not configured');
  process.exit(1);
}

// Get all products from database
const allProducts = await db.select().from(products);
console.log(`Found ${allProducts.length} products in database`);

// For each product, fetch from WooCommerce and update image
for (const product of allProducts) {
  if (!product.woocommerceId) {
    console.log(`Skipping ${product.sku} - no WooCommerce ID`);
    continue;
  }

  try {
    console.log(`Fetching product ${product.woocommerceId} from WooCommerce...`);
    const wooProduct = await woo.getProduct(product.woocommerceId);
    
    if (wooProduct.images && wooProduct.images.length > 0) {
      const imageUrl = wooProduct.images[0].src;
      console.log(`  Image URL: ${imageUrl}`);
      
      // Download and upload to S3
      const s3Url = await downloadAndUploadImage(imageUrl, product.sku);
      
      if (s3Url) {
        // Update database
        await db.update(products)
          .set({ imageUrl: s3Url })
          .where(eq(products.id, product.id));
        
        console.log(`  ✅ Updated ${product.sku} with image: ${s3Url}`);
      } else {
        console.log(`  ❌ Failed to upload image for ${product.sku}`);
      }
    } else {
      console.log(`  No images found for ${product.sku}`);
    }
  } catch (error) {
    console.error(`  Error processing ${product.sku}:`, error.message);
  }
  
  // Small delay to avoid rate limiting
  await new Promise(resolve => setTimeout(resolve, 500));
}

console.log('Image import complete!');
