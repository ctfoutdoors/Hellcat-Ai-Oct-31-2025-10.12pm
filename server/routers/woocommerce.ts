import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { createWooCommerceClient } from "../integrations/woocommerce";
import { getDb } from "../db";
import { products } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const woocommerceRouter = router({
  /**
   * List all products from WooCommerce with import status
   */
  listProducts: protectedProcedure.query(async () => {
    const wooClient = createWooCommerceClient();
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Fetch all products from WooCommerce
    const wooProducts = await wooClient.getProducts({ per_page: 100 });

    // Get all existing products from our database
    const existingProducts = await db.select().from(products);
    const existingBySKU = new Map(existingProducts.map(p => [p.sku, p]));

    // Map WooCommerce products with import status
    return wooProducts.map((wooProduct: any) => {
      const existing = existingBySKU.get(wooProduct.sku);
      const hasChanges = existing ? checkProductChanges(wooProduct, existing) : false;
      const changedFields = existing ? getChangedFields(wooProduct, existing) : [];

      return {
        id: wooProduct.id,
        sku: wooProduct.sku,
        name: wooProduct.name,
        price: wooProduct.price,
        regularPrice: wooProduct.regular_price,
        salePrice: wooProduct.sale_price,
        description: wooProduct.description,
        shortDescription: wooProduct.short_description,
        categories: wooProduct.categories,
        images: wooProduct.images,
        variations: wooProduct.variations || [],
        stockQuantity: wooProduct.stock_quantity,
        stockStatus: wooProduct.stock_status,
        imported: !!existing,
        hasChanges,
        changedFields,
      };
    });
  }),

  /**
   * Import a single product from WooCommerce
   */
  importProduct: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .mutation(async ({ input }) => {
      const wooClient = createWooCommerceClient();
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Fetch product from WooCommerce
      const wooProduct = await wooClient.request(`/products/${input.productId}`);

      // Insert into database
      await db.insert(products).values({
        sku: wooProduct.sku || `WOO-${wooProduct.id}`,
        name: wooProduct.name,
        description: wooProduct.description,
        category: wooProduct.categories?.[0]?.name || null,
        cost: wooProduct.regular_price ? String(Number(wooProduct.regular_price) * 0.6) : "0", // Estimate 40% margin
        price: wooProduct.price || wooProduct.regular_price || "0",
        margin: "40.00", // Default margin
        supplier: "WooCommerce",
        isActive: wooProduct.status === "publish",
      });

      return { success: true };
    }),

  /**
   * Bulk import multiple products from WooCommerce
   */
  bulkImportProducts: protectedProcedure
    .input(z.object({ productIds: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      const wooClient = createWooCommerceClient();
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const results = {
        total: input.productIds.length,
        imported: 0,
        failed: 0,
        errors: [] as Array<{ productId: number; error: string }>,
      };

      for (const productId of input.productIds) {
        try {
          // Fetch product from WooCommerce
          const wooProduct = await wooClient.request(`/products/${productId}`);

          // Insert into database
          await db.insert(products).values({
            sku: wooProduct.sku || `WOO-${wooProduct.id}`,
            name: wooProduct.name,
            description: wooProduct.description,
            category: wooProduct.categories?.[0]?.name || null,
            cost: wooProduct.regular_price ? String(Number(wooProduct.regular_price) * 0.6) : "0",
            price: wooProduct.price || wooProduct.regular_price || "0",
            margin: "40.00",
            supplier: "WooCommerce",
            isActive: wooProduct.status === "publish",
          });

          results.imported++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            productId,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return results;
    }),

  /**
   * Bulk update multiple products with changes from WooCommerce
   */
  bulkUpdateProducts: protectedProcedure
    .input(z.object({ productIds: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      const wooClient = createWooCommerceClient();
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const results = {
        total: input.productIds.length,
        updated: 0,
        failed: 0,
        errors: [] as Array<{ productId: number; error: string }>,
      };

      for (const productId of input.productIds) {
        try {
          // Fetch product from WooCommerce
          const wooProduct = await wooClient.request(`/products/${productId}`);

          // Update in database by SKU
          const sku = wooProduct.sku || `WOO-${wooProduct.id}`;
          await db
            .update(products)
            .set({
              name: wooProduct.name,
              description: wooProduct.description,
              category: wooProduct.categories?.[0]?.name || null,
              price: wooProduct.price || wooProduct.regular_price || "0",
              isActive: wooProduct.status === "publish",
            })
            .where(eq(products.sku, sku));

          results.updated++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            productId,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return results;
    }),

  /**
   * Update an existing product with changes from WooCommerce
   */
  updateProduct: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .mutation(async ({ input }) => {
      const wooClient = createWooCommerceClient();
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Fetch product from WooCommerce
      const wooProduct = await wooClient.request(`/products/${input.productId}`);

      // Update in database by SKU
      const sku = wooProduct.sku || `WOO-${wooProduct.id}`;
      await db
        .update(products)
        .set({
          name: wooProduct.name,
          description: wooProduct.description,
          category: wooProduct.categories?.[0]?.name || null,
          price: wooProduct.price || wooProduct.regular_price || "0",
          isActive: wooProduct.status === "publish",
        })
        .where(eq(products.sku, sku));

      return { success: true };
    }),
});

/**
 * Check if WooCommerce product has changes compared to database product
 */
function checkProductChanges(wooProduct: any, dbProduct: any): boolean {
  const fields = getChangedFields(wooProduct, dbProduct);
  return fields.length > 0;
}

/**
 * Get list of changed fields between WooCommerce and database product
 */
function getChangedFields(wooProduct: any, dbProduct: any): string[] {
  const changed: string[] = [];

  if (wooProduct.name !== dbProduct.name) changed.push("name");
  if (wooProduct.description !== dbProduct.description) changed.push("description");
  if (wooProduct.price !== dbProduct.price) changed.push("price");
  if ((wooProduct.status === "publish") !== dbProduct.isActive) changed.push("status");

  return changed;
}
