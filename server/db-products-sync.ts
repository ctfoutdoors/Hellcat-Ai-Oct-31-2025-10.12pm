/**
 * ShipStation Products Sync Functions
 * Syncs products from ShipStation API to local database
 */

import { getDb } from './db';
import { products } from '../drizzle/schema';
import { createShipStationClient } from './integrations/shipstation';
import { eq } from 'drizzle-orm';

interface ShipStationProduct {
  productId: number;
  sku: string;
  name: string;
  price: number;
  defaultCost?: number;
  length?: number;
  width?: number;
  height?: number;
  weightOz?: number;
  internalNotes?: string;
  fulfillmentSku?: string;
  createDate?: string;
  modifyDate?: string;
  active: boolean;
  productCategory?: {
    categoryId: number;
    name: string;
  };
  productType?: string;
  warehouseLocation?: string;
  defaultCarrierCode?: string;
  defaultServiceCode?: string;
  defaultPackageCode?: string;
  defaultIntlCarrierCode?: string;
  defaultIntlServiceCode?: string;
  defaultIntlPackageCode?: string;
  defaultConfirmation?: string;
  defaultIntlConfirmation?: string;
  customsDescription?: string;
  customsValue?: number;
  customsTariffNo?: string;
  customsCountryCode?: string;
  noCustoms?: boolean;
  tags?: Array<{
    tagId: number;
    name: string;
  }>;
}

/**
 * Sync all products from ShipStation to local database
 */
export async function syncProductsFromShipStation(): Promise<{
  success: boolean;
  productsProcessed: number;
  productsCreated: number;
  productsUpdated: number;
  errors: string[];
}> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const client = createShipStationClient();
  if (!client) {
    throw new Error('ShipStation client not configured');
  }

  const result = {
    success: true,
    productsProcessed: 0,
    productsCreated: 0,
    productsUpdated: 0,
    errors: [] as string[],
  };

  try {
    console.log(`[Products Sync] Fetching all products from ShipStation`);

    let page = 1;
    let hasMore = true;
    const pageSize = 500; // Max page size

    while (hasMore) {
      // Fetch products from ShipStation
      const response = await client.getProducts({
        page,
        pageSize,
      });

      const shipstationProducts: ShipStationProduct[] = response.products || [];
      console.log(`[Products Sync] Page ${page}: Retrieved ${shipstationProducts.length} products`);

      if (shipstationProducts.length === 0) {
        hasMore = false;
        break;
      }

      // Process each product
      for (const ssProduct of shipstationProducts) {
        try {
          result.productsProcessed++;

          // Skip products without SKU
          if (!ssProduct.sku) {
            result.errors.push(`Product ${ssProduct.productId} has no SKU, skipping`);
            continue;
          }

          // Check if product already exists
          const existing = await db
            .select()
            .from(products)
            .where(eq(products.sku, ssProduct.sku))
            .limit(1);

          const productData = {
            sku: ssProduct.sku,
            name: ssProduct.name || 'Unknown Product',
            description: ssProduct.internalNotes || null,
            category: ssProduct.productCategory?.name || null,
            price: ssProduct.price || 0,
            cost: ssProduct.defaultCost || null,
            weight: ssProduct.weightOz ? ssProduct.weightOz / 16 : null, // Convert oz to lbs
            dimensions: ssProduct.length && ssProduct.width && ssProduct.height
              ? `${ssProduct.length}x${ssProduct.width}x${ssProduct.height}`
              : null,
            isActive: ssProduct.active,
            externalId: ssProduct.productId.toString(),
            source: 'shipstation',
            productData: ssProduct as any,
            updatedAt: new Date(),
          };

          if (existing.length > 0) {
            // Update existing product
            await db
              .update(products)
              .set(productData)
              .where(eq(products.sku, ssProduct.sku));
            result.productsUpdated++;
          } else {
            // Create new product
            await db.insert(products).values({
              ...productData,
              createdAt: new Date(),
            });
            result.productsCreated++;
          }
        } catch (error: any) {
          result.errors.push(`Error processing product ${ssProduct.sku}: ${error.message}`);
          console.error(`[Products Sync] Error processing product ${ssProduct.sku}:`, error);
        }
      }

      // Check if there are more pages
      if (shipstationProducts.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }

    console.log(`[Products Sync] Complete: ${result.productsCreated} created, ${result.productsUpdated} updated`);
    
    if (result.errors.length > 0) {
      console.warn(`[Products Sync] Encountered ${result.errors.length} errors`);
    }

  } catch (error: any) {
    result.success = false;
    result.errors.push(`Sync failed: ${error.message}`);
    console.error('[Products Sync] Failed:', error);
  }

  return result;
}

/**
 * Get product sync status
 */
export async function getProductSyncStatus(): Promise<{
  lastSync: Date | null;
  totalProducts: number;
  activeProducts: number;
}> {
  const db = await getDb();
  if (!db) {
    return {
      lastSync: null,
      totalProducts: 0,
      activeProducts: 0,
    };
  }

  const allProducts = await db.select().from(products);
  const activeProducts = allProducts.filter(p => p.isActive);

  // Get most recent update time
  const lastSync = allProducts.length > 0
    ? allProducts.reduce((latest, p) => {
        return p.updatedAt > latest ? p.updatedAt : latest;
      }, allProducts[0].updatedAt)
    : null;

  return {
    lastSync,
    totalProducts: allProducts.length,
    activeProducts: activeProducts.length,
  };
}
