import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { createWooCommerceClient } from "../integrations/woocommerce";
import { createShipStationClient } from "../integrations/shipstation";
import { getDb } from "../db";
import { products, channelInventory } from "../../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { downloadAndUploadImage } from "../lib/imageSync";

export const productSyncRouter = router({
  // Sync inventory from ShipStation
  syncShipStationInventory: protectedProcedure.mutation(async () => {
    const shipstationClient = createShipStationClient();
    if (!shipstationClient) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'ShipStation client not configured',
      });
    }

    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database not available',
      });
    }

    let success = 0;
    let failed = 0;

    try {
      // Get all warehouses
      const warehousesResponse = await shipstationClient.getWarehouses();
      const warehouses = warehousesResponse.warehouses || [];

      // Get all products from ShipStation
      const productsResponse = await shipstationClient.getProducts();
      const shipstationProducts = productsResponse.products || [];

      // For each product, get inventory per warehouse
      for (const ssProduct of shipstationProducts) {
        try {
          // Find matching product in our database by SKU
          const dbProducts = await db
            .select()
            .from(products)
            .where(eq(products.sku, ssProduct.sku))
            .limit(1);

          if (dbProducts.length === 0) continue;

          const dbProduct = dbProducts[0];

          // For each warehouse, store inventory
          for (const warehouse of warehouses) {
            const warehouseId = warehouse.warehouseId;
            const warehouseName = warehouse.warehouseName;
            
            // Get quantity for this warehouse (ShipStation API returns inventory per warehouse)
            const quantity = ssProduct.warehouseLocation?.[warehouseId] || 0;

            // Upsert channel inventory
            await db
              .insert(channelInventory)
              .values({
                productId: dbProduct.id,
                channel: `shipstation-${warehouseName}`,
                sku: ssProduct.sku,
                quantity: quantity,
                buffer: 0,
                zeroStockThreshold: 0,
                manualOverride: null,
              })
              .onDuplicateKeyUpdate({
                set: {
                  quantity: quantity,
                  updatedAt: new Date(),
                },
              });
          }

          success++;
        } catch (error) {
          console.error(`Failed to sync inventory for ${ssProduct.sku}:`, error);
          failed++;
        }
      }

      return { success, failed, total: shipstationProducts.length };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to sync ShipStation inventory: ${(error as Error).message}`,
      });
    }
  }),
  /**
   * Sync all product images from WooCommerce
   */
  syncAllImages: protectedProcedure.mutation(async () => {
    const wooClient = createWooCommerceClient();
    if (!wooClient) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'WooCommerce not configured' });

    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

    // Get all products that need images
    const productsToUpdate = await db
      .select()
      .from(products)
      .where(sql`${products.imageUrl} IS NULL OR ${products.imageUrl} = ''`);

    const results = {
      success: 0,
      skipped: 0,
      failed: 0,
      total: productsToUpdate.length,
    };

    for (const product of productsToUpdate) {
      try {
        // Extract WooCommerce ID from SKU
        let wooProductId = null;
        if (product.sku?.startsWith('WOO-')) {
          wooProductId = parseInt(product.sku.replace('WOO-', ''));
        }

        if (!wooProductId) {
          results.skipped++;
          continue;
        }

        // Fetch from WooCommerce
        const response = await wooClient.request(`/products/${wooProductId}`);
        
        if (!response?.images?.[0]?.src) {
          results.skipped++;
          continue;
        }

        // Download and upload image
        const imageUrl = response.images[0].src;
        const s3Url = await downloadAndUploadImage(imageUrl, product.sku);

        if (s3Url) {
          await db.update(products)
            .set({ imageUrl: s3Url })
            .where(eq(products.id, product.id));
          results.success++;
        } else {
          results.failed++;
        }

        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`Error syncing image for ${product.sku}:`, error);
        results.failed++;
      }
    }

    return results;
  }),

  /**
   * Sync inventory from ShipStation to channel_inventory table
   */
  syncShipStationInventory: protectedProcedure.mutation(async () => {
    const ssClient = createShipStationClient();
    if (!ssClient) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'ShipStation not configured' });

    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

    // Get all warehouses
    const warehouses = await ssClient.getWarehouses();
    
    // Get all products from ShipStation
    const ssProducts = await ssClient.getProducts();

    const results = {
      productsUpdated: 0,
      inventoryRecordsCreated: 0,
      errors: 0,
    };

    for (const ssProduct of ssProducts) {
      try {
        // Find matching product in our database by SKU
        const dbProducts = await db
          .select()
          .from(products)
          .where(eq(products.sku, ssProduct.sku))
          .limit(1);

        if (dbProducts.length === 0) {
          continue; // Skip if product doesn't exist in our DB
        }

        const dbProduct = dbProducts[0];

        // Update ShipStation cost if available
        if (ssProduct.customsValue) {
          await db.update(products)
            .set({ shipstationCost: ssProduct.customsValue.toString() })
            .where(eq(products.id, dbProduct.id));
        }

        // Create/update channel inventory records for each warehouse
        for (const warehouse of warehouses) {
          // Get warehouse-specific quantity (ShipStation API doesn't provide this directly)
          // For now, we'll use the total quantity and distribute it
          const quantity = ssProduct.warehouseLocation ? 
            parseInt(ssProduct.warehouseLocation) || 0 : 0;

          await db.insert(channelInventory).values({
            productId: dbProduct.id,
            sku: ssProduct.sku,
            channel: 'shipstation',
            warehouseId: warehouse.warehouseId?.toString() || null,
            warehouseName: warehouse.warehouseName || null,
            availableQty: quantity,
            buffer: 0,
            zeroStockThreshold: 0,
            manualOverride: null,
            lastSyncAt: new Date(),
          }).onDuplicateKeyUpdate({
            set: {
              availableQty: quantity,
              lastSyncAt: new Date(),
            },
          });

          results.inventoryRecordsCreated++;
        }

        results.productsUpdated++;
      } catch (error) {
        console.error(`Error syncing inventory for ${ssProduct.sku}:`, error);
        results.errors++;
      }
    }

    return results;
  }),

  /**
   * Sync all product data (images + inventory)
   */
  syncAll: protectedProcedure.mutation(async ({ ctx }) => {
    // Call both sync operations
    const imageResults = await ctx.procedures.productSync.syncAllImages();
    const inventoryResults = await ctx.procedures.productSync.syncShipStationInventory();

    return {
      images: imageResults,
      inventory: inventoryResults,
    };
  }),
});
