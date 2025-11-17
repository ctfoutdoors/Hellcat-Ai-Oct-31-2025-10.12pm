import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { getDb } from "../db";
import { parseBOL, parseInvoice, parsePurchaseOrder } from "../services/pdfParser";
import { 
  vendors,
  vendorContacts,
  purchaseOrders,
  poLineItems,
  shipments,
  invoices,
  receivingLogs
} from '../../drizzle/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

/**
 * Purchase Order Router
 * Manages PO intake workflow: vendors → POs → line items → shipments → invoices → receiving
 */

export const poRouter = router({
  
  /**
   * List purchase orders by vendor
   */
  listByVendor: protectedProcedure
    .input(z.object({
      vendorId: z.number(),
    }))
    .query(async ({ input }) => {
      console.log('[PO Router] listByVendor called with vendorId:', input.vendorId);
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const orders = await db
        .select()
        .from(purchaseOrders)
        .where(eq(purchaseOrders.vendorId, input.vendorId))
        .orderBy(desc(purchaseOrders.orderDate));
      
      console.log('[PO Router] Found orders:', orders.length);
      return { orders };
    }),
  
  /**
   * Get purchase order detail with line items, shipment, invoice
   */
  getDetail: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Get PO
      const [po] = await db
        .select()
        .from(purchaseOrders)
        .where(eq(purchaseOrders.id, input.id))
        .limit(1);
      
      if (!po) throw new Error('Purchase order not found');
      
      // Get vendor
      const [vendor] = await db
        .select()
        .from(vendors)
        .where(eq(vendors.id, po.vendorId))
        .limit(1);
      
      // Get line items
      const lineItems = await db
        .select()
        .from(poLineItems)
        .where(eq(poLineItems.poId, input.id))
        .orderBy(poLineItems.id);
      
      // TODO: Fix drizzle schema sync issue with poId columns
      // Temporarily return empty arrays until schema is fully synced
      const shipmentsData: any[] = [];
      const invoicesData: any[] = [];
      
      // Get receiving logs
      const receiving = await db
        .select()
        .from(receivingLogs)
        .where(eq(receivingLogs.poId, input.id))
        .orderBy(desc(receivingLogs.receivedDate));
      
      return {
        po,
        vendor,
        lineItems,
        shipments: shipmentsData,
        invoices: invoicesData,
        receiving,
      };
    }),
  
  /**
   * List all purchase orders with filters
   */
  list: protectedProcedure
    .input(z.object({
      status: z.enum(['draft', 'sent', 'approved', 'received', 'cancelled']).optional(),
      vendorId: z.number().optional(),
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const conditions = [];
      
      if (input.status) {
        conditions.push(eq(purchaseOrders.status, input.status));
      }
      
      if (input.vendorId) {
        conditions.push(eq(purchaseOrders.vendorId, input.vendorId));
      }
      
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const offset = (input.page - 1) * input.pageSize;
      
      const orders = await db
        .select({
          id: purchaseOrders.id,
          poNumber: purchaseOrders.poNumber,
          vendorId: purchaseOrders.vendorId,
          orderDate: purchaseOrders.orderDate,
          expectedDeliveryDate: purchaseOrders.expectedDeliveryDate,
          totalAmount: purchaseOrders.totalAmount,
          status: purchaseOrders.status,
          vendorName: vendors.companyName,
        })
        .from(purchaseOrders)
        .leftJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
        .where(whereClause)
        .orderBy(desc(purchaseOrders.orderDate))
        .limit(input.pageSize)
        .offset(offset);
      
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(purchaseOrders)
        .where(whereClause);
      
      return {
        orders,
        total: Number(count),
        page: input.page,
        pageSize: input.pageSize,
      };
    }),
  
  /**
   * Create purchase order
   */
  create: protectedProcedure
    .input(z.object({
      poNumber: z.string(),
      vendorId: z.number(),
      orderDate: z.date(),
      expectedDeliveryDate: z.date().optional(),
      shippingAddress: z.any().optional(),
      notes: z.string().optional(),
      lineItems: z.array(z.object({
        lineNumber: z.number(),
        sku: z.string(),
        description: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        totalPrice: z.number(),
      })),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Calculate total
      const totalAmount = input.lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
      
      // Create PO
      const [po] = await db
        .insert(purchaseOrders)
        .values({
          poNumber: input.poNumber,
          vendorId: input.vendorId,
          orderDate: input.orderDate,
          expectedDeliveryDate: input.expectedDeliveryDate,
          shippingAddress: input.shippingAddress,
          totalAmount,
          status: 'draft',
          notes: input.notes,
        })
        .$returningId();
      
      // Create line items
      if (input.lineItems.length > 0) {
        await db.insert(poLineItems).values(
          input.lineItems.map(item => ({
            poId: po.id,
            lineNumber: item.lineNumber,
            sku: item.sku,
            description: item.description,
            quantityOrdered: item.quantity,
            unitPrice: item.unitPrice.toString(),
            totalPrice: item.totalPrice.toString(),
          }))
        );
      }
      
      return { poId: po.id };
    }),
  
  /**
   * Update PO status
   */
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(['draft', 'sent', 'approved', 'received', 'cancelled']),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      await db
        .update(purchaseOrders)
        .set({ status: input.status })
        .where(eq(purchaseOrders.id, input.id));
      
      return { success: true };
    }),
  
  /**
   * Add shipment tracking
   */
  addShipment: protectedProcedure
    .input(z.object({
      poId: z.number(),
      bolNumber: z.string(),
      carrier: z.string(),
      trackingNumber: z.string().optional(),
      shipDate: z.date(),
      estimatedDelivery: z.date().optional(),
      actualDelivery: z.date().optional(),
      status: z.enum(['pending', 'in_transit', 'delivered', 'exception']).default('pending'),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const [shipment] = await db
        .insert(shipments)
        .values(input)
        .$returningId();
      
      return { shipmentId: shipment.id };
    }),
  
  /**
   * Add invoice
   */
  addInvoice: protectedProcedure
    .input(z.object({
      poId: z.number(),
      invoiceNumber: z.string(),
      invoiceDate: z.date(),
      dueDate: z.date().optional(),
      subtotal: z.number(),
      tax: z.number().optional(),
      shipping: z.number().optional(),
      total: z.number(),
      paymentStatus: z.enum(['pending', 'paid', 'overdue', 'cancelled']).default('pending'),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const [invoice] = await db
        .insert(invoices)
        .values({
          ...input,
          subtotal: input.subtotal.toString(),
          tax: input.tax?.toString(),
          shipping: input.shipping?.toString(),
          total: input.total.toString(),
        })
        .$returningId();
      
      return { invoiceId: invoice.id };
    }),
  
  /**
   * Add receiving log
   */
  addReceiving: protectedProcedure
    .input(z.object({
      poId: z.number(),
      lineItemId: z.number(),
      quantityReceived: z.number(),
      receivedDate: z.date(),
      receivedBy: z.string(),
      condition: z.enum(['good', 'damaged', 'partial']).default('good'),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const [log] = await db
        .insert(receivingLogs)
        .values(input)
        .$returningId();
      
      return { logId: log.id };
    }),
  
  /**
   * Parse BOL PDF and extract data
   */
  parseBOL: protectedProcedure
    .input(z.object({
      pdfUrl: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      const data = await parseBOL(input.pdfUrl);
      return data;
    }),
  
  /**
   * Parse Invoice PDF and extract data
   */
  parseInvoice: protectedProcedure
    .input(z.object({
      pdfUrl: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      const data = await parseInvoice(input.pdfUrl);
      return data;
    }),
  
  /**
   * Parse Purchase Order PDF and extract data
   */
  parsePO: protectedProcedure
    .input(z.object({
      pdfUrl: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      const data = await parsePurchaseOrder(input.pdfUrl);
      return data;
    }),
});
