import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { createWooCommerceClient } from "../integrations/woocommerce";
import { getDb } from "../db";
import { products, productVariants, orders } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { downloadAndUploadImage } from "../lib/imageSync";

export const woocommerceRouter = router({
  /**
   * Import today's orders from WooCommerce
   */
  importTodaysOrders: protectedProcedure.mutation(async () => {
    const wooClient = createWooCommerceClient();
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Fetch orders created today from WooCommerce
    const wooOrders = await wooClient.getOrders({
      after: todayStr + 'T00:00:00',
      per_page: 100
    });

    let imported = 0;
    let skipped = 0;

    for (const wooOrder of wooOrders) {
      // Check if order already exists
      const existing = await db
        .select()
        .from(orders)
        .where(eq(orders.externalId, String(wooOrder.id)))
        .limit(1);

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      // Map WooCommerce order to our schema
      const orderData: any = {
        orderNumber: `WOO-${wooOrder.id}`,
        source: "WooCommerce",
        channel: wooOrder.meta_data?.find((m: any) => m.key === '_channel')?.value || 'Website',
        externalId: String(wooOrder.id),
        customerName: `${wooOrder.billing.first_name} ${wooOrder.billing.last_name}`.trim(),
        customerEmail: wooOrder.billing.email,
        customerPhone: wooOrder.billing.phone || null,
        shippingAddress: JSON.stringify({
          name: `${wooOrder.shipping.first_name} ${wooOrder.shipping.last_name}`.trim(),
          company: wooOrder.shipping.company || null,
          address1: wooOrder.shipping.address_1,
          address2: wooOrder.shipping.address_2 || null,
          city: wooOrder.shipping.city,
          state: wooOrder.shipping.state,
          zip: wooOrder.shipping.postcode,
          country: wooOrder.shipping.country,
          phone: wooOrder.shipping.phone || wooOrder.billing.phone || null
        }),
        orderDate: new Date(wooOrder.date_created),
        shipDate: wooOrder.date_completed ? new Date(wooOrder.date_completed) : null,
        totalAmount: wooOrder.total,
        shippingCost: wooOrder.shipping_total,
        taxAmount: wooOrder.total_tax,
        status: wooOrder.status,
        orderItems: JSON.stringify(wooOrder.line_items.map((item: any) => ({
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        }))),
        trackingNumber: wooOrder.meta_data?.find((m: any) => m.key === '_tracking_number')?.value || null,
        carrierCode: wooOrder.meta_data?.find((m: any) => m.key === '_carrier_code')?.value || null,
        serviceCode: wooOrder.meta_data?.find((m: any) => m.key === '_service_code')?.value || null,
        orderData: JSON.stringify(wooOrder)
      };

      // Insert into database
      await db.insert(orders).values(orderData);
      imported++;
    }

    return { imported, skipped, total: wooOrders.length };
  }),

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

          // Download and upload product image if available
          let imageUrl: string | null = null;
          if (wooProduct.images && wooProduct.images.length > 0) {
            const firstImage = wooProduct.images[0];
            imageUrl = await downloadAndUploadImage(
              firstImage.src,
              wooProduct.sku || `WOO-${wooProduct.id}`
            );
          }

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
            imageUrl: imageUrl,
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

          // Download and upload product image if available
          let imageUrl: string | null = null;
          if (wooProduct.images && wooProduct.images.length > 0) {
            const firstImage = wooProduct.images[0];
            imageUrl = await downloadAndUploadImage(
              firstImage.src,
              wooProduct.sku || `WOO-${wooProduct.id}`
            );
          }

          // Update in database by SKU
          const sku = wooProduct.sku || `WOO-${wooProduct.id}`;
          const updateData: any = {
            name: wooProduct.name,
            description: wooProduct.description,
            category: wooProduct.categories?.[0]?.name || null,
            price: wooProduct.price || wooProduct.regular_price || "0",
            isActive: wooProduct.status === "publish",
          };
          
          // Only update image if we successfully downloaded a new one
          if (imageUrl) {
            updateData.imageUrl = imageUrl;
          }

          await db
            .update(products)
            .set(updateData)
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
   * Get product variations from WooCommerce
   */
  getProductVariations: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      const wooClient = createWooCommerceClient();
      if (!wooClient) throw new Error("WooCommerce not configured");

      const variations = await wooClient.getProductVariations(input.productId);
      
      // Get existing variants from database
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const existingVariants = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.parentProductId, input.productId));
      
      const existingByWooId = new Map(existingVariants.map(v => [v.woocommerceVariationId, v]));
      
      // Map variations with import status
      const mappedVariations = variations.map((variation: any) => ({
        ...variation,
        imported: existingByWooId.has(variation.id),
        dbVariant: existingByWooId.get(variation.id) || null,
      }));
      
      return { variations: mappedVariations };
    }),

  /**
   * Import product variant to database
   */
  importVariant: protectedProcedure
    .input(z.object({ productId: z.number(), variationId: z.number() }))
    .mutation(async ({ input }) => {
      const wooClient = createWooCommerceClient();
      if (!wooClient) throw new Error("WooCommerce not configured");

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Fetch the variation from WooCommerce
      const variations = await wooClient.getProductVariations(input.productId);
      const variation = variations.find((v: any) => v.id === input.variationId);

      if (!variation) throw new Error("Variation not found");

      // Download and upload variant image if available
      let imageUrl: string | null = null;
      if (variation.image?.src) {
        imageUrl = await downloadAndUploadImage(
          variation.image.src,
          variation.sku || `variant-${variation.id}`
        );
      }

      // Check if variant already exists
      const existing = await db
        .select()
        .from(productVariants)
        .where(eq(productVariants.woocommerceVariationId, variation.id))
        .limit(1);

      const variantData: any = {
        parentProductId: input.productId,
        woocommerceVariationId: variation.id,
        variantSku: variation.sku || `VAR-${variation.id}`,
        attributes: variation.attributes || [],
        price: variation.price || "0",
        compareAtPrice: variation.regular_price || null,
        cost: null,
        stock: variation.stock_quantity || 0,
        imageUrl,
        isActive: variation.status === "publish",
      };

      if (existing.length > 0) {
        await db
          .update(productVariants)
          .set(variantData)
          .where(eq(productVariants.id, existing[0].id));
        return { success: true, variant: { ...existing[0], ...variantData } };
      } else {
        const result = await db.insert(productVariants).values(variantData);
        return { success: true, variantId: result[0].insertId };
      }
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
