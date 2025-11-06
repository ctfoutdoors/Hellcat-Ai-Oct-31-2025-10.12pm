/**
 * ShipStation Inventory Sync
 * Syncs product inventory from ShipStation warehouses and matches by SKU
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
  defaultCost: number;
  length: number;
  width: number;
  height: number;
  weightOz: number;
  internalNotes: string;
  fulfillmentSku: string;
  createDate: string;
  modifyDate: string;
  active: boolean;
  productCategory: any;
  productType: string;
  warehouseLocation: string;
  defaultCarrierCode: string;
  defaultServiceCode: string;
  defaultPackageCode: string;
  defaultIntlCarrierCode: string;
  defaultIntlServiceCode: string;
  defaultIntlPackageCode: string;
  defaultConfirmation: string;
  defaultIntlConfirmation: string;
  customsDescription: string;
  customsValue: number;
  customsTariffNo: string;
  customsCountryCode: string;
  noCustoms: boolean;
  tags: any[];
}

interface WarehouseInventory {
  warehouseId: number;
  warehouseName: string;
  sku: string;
  quantity: number;
  onHand: number;
  available: number;
  reserved: number;
  allocated: number;
}

/**
 * Sync inventory from ShipStation
 */
export async function syncInventoryFromShipStation(): Promise<{
  success: boolean;
  productsProcessed: number;
  productsMatched: number;
  productsCreated: number;
  productsUpdated: number;
  warehousesFound: string[];
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
    productsMatched: 0,
    productsCreated: 0,
    productsUpdated: 0,
    warehousesFound: [] as string[],
    errors: [] as string[],
  };

  try {
    console.log('[Inventory Sync] Fetching products from ShipStation...');

    // Fetch products from ShipStation
    const productsResponse = await client.getProducts({
      pageSize: 500,
    });

    const ssProducts: ShipStationProduct[] = productsResponse.products || [];
    console.log(`[Inventory Sync] Retrieved ${ssProducts.length} products`);

    // Fetch warehouses
    console.log('[Inventory Sync] Fetching warehouses...');
    const warehousesResponse = await client.getWarehouses();
    const warehouses = warehousesResponse || [];
    console.log(`[Inventory Sync] Found ${warehouses.length} warehouses`);

    result.warehousesFound = warehouses.map((w: any) => w.warehouseName || `Warehouse ${w.warehouseId}`);

    // Fetch all existing products from database
    const existingProducts = await db.select().from(products);
    console.log(`[Inventory Sync] Loaded ${existingProducts.length} existing products from database`);

    // Process each ShipStation product
    for (const ssProduct of ssProducts) {
      try {
        result.productsProcessed++;

        if (!ssProduct.sku) {
          console.log(`[Inventory Sync] Skipping product without SKU: ${ssProduct.name}`);
          continue;
        }

        // Fetch inventory for this SKU across all warehouses
        let totalQuantity = 0;
        let warehouseData: any[] = [];

        try {
          const inventoryResponse = await client.getProductInventory(ssProduct.productId);
          warehouseData = inventoryResponse || [];
          
          // Calculate total quantity across all warehouses
          totalQuantity = warehouseData.reduce((sum: number, inv: any) => {
            return sum + (inv.available || 0);
          }, 0);

          console.log(`[Inventory Sync] SKU ${ssProduct.sku}: ${totalQuantity} units across ${warehouseData.length} warehouses`);
        } catch (invError) {
          console.warn(`[Inventory Sync] Could not fetch inventory for SKU ${ssProduct.sku}:`, invError);
          // Continue with 0 quantity
        }

        // Check if product exists in database by SKU
        const existing = existingProducts.find(p => p.sku === ssProduct.sku);

        const productData = {
          sku: ssProduct.sku,
          name: ssProduct.name,
          category: ssProduct.productCategory?.name || null,
          quantity: totalQuantity,
          cost: ssProduct.defaultCost?.toString() || null,
          price: ssProduct.price?.toString() || null,
          supplier: null, // Not available in ShipStation
          barcode: null, // Not available in ShipStation
          margin: ssProduct.price && ssProduct.defaultCost 
            ? ((ssProduct.price - ssProduct.defaultCost) / ssProduct.price * 100).toFixed(2)
            : null,
          leadTimeDays: null, // Not available in ShipStation
          warehouseLocation: ssProduct.warehouseLocation || null,
          productData: {
            ...ssProduct,
            warehouseInventory: warehouseData,
          },
        };

        if (existing) {
          // Update existing product
          await db
            .update(products)
            .set({
              ...productData,
              updatedAt: new Date(),
            })
            .where(eq(products.id, existing.id));
          
          result.productsUpdated++;
          result.productsMatched++;
          console.log(`[Inventory Sync] ✓ Updated product: ${ssProduct.sku} - ${ssProduct.name}`);
        } else {
          // Create new product
          await db.insert(products).values(productData as any);
          
          result.productsCreated++;
          console.log(`[Inventory Sync] ✓ Created product: ${ssProduct.sku} - ${ssProduct.name}`);
        }
      } catch (error) {
        console.error(`[Inventory Sync] Error processing product ${ssProduct.sku}:`, error);
        result.errors.push(`Product ${ssProduct.sku}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`[Inventory Sync] Complete: ${result.productsCreated} created, ${result.productsUpdated} updated, ${result.productsMatched} matched`);
  } catch (error) {
    console.error('[Inventory Sync] Fatal error:', error);
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return result;
}

/**
 * Get inventory statistics
 */
export async function getInventoryStats() {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const allProducts = await db.select().from(products);

  const stats = {
    totalProducts: allProducts.length,
    totalValue: allProducts.reduce((sum, p) => {
      const qty = p.quantity || 0;
      const price = parseFloat(p.price || '0');
      return sum + (qty * price);
    }, 0),
    lowStock: allProducts.filter(p => (p.quantity || 0) < 10).length,
    outOfStock: allProducts.filter(p => (p.quantity || 0) === 0).length,
    byCategory: {} as Record<string, number>,
    topProducts: allProducts
      .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
      .slice(0, 10),
  };

  // Count by category
  allProducts.forEach(product => {
    const category = product.category || 'Uncategorized';
    stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
  });

  return stats;
}
