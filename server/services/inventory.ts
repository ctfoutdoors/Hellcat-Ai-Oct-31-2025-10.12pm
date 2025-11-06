/**
 * Inventory Management Service
 * 
 * Handles stock levels, transactions, valuations, and reorder management
 * Supports FIFO, LIFO, and weighted average cost methods
 */

interface InventoryItem {
  id: number;
  productId: number;
  sku: string;
  quantityOnHand: number;
  quantityAllocated: number;
  quantityAvailable: number;
  quantityOnOrder: number;
  reorderPoint: number;
  reorderQuantity: number;
  warehouseLocation?: string;
  binLocation?: string;
  averageCost: number; // in cents
  lastCost: number; // in cents
  totalValue: number; // in cents
  lastReceivedDate?: Date;
  lastSoldDate?: Date;
}

interface InventoryTransaction {
  id: number;
  productId: number;
  sku: string;
  transactionType: 'purchase' | 'sale' | 'adjustment' | 'transfer' | 'return' | 'damage' | 'count';
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  unitCost?: number;
  totalCost?: number;
  referenceType?: string;
  referenceId?: number;
  referenceNumber?: string;
  fromLocation?: string;
  toLocation?: string;
  notes?: string;
  createdBy: number;
  createdAt: Date;
}

interface ValuationSnapshot {
  snapshotDate: Date;
  totalQuantity: number;
  totalValue: number;
  valuationFIFO: number;
  valuationLIFO: number;
  valuationWeightedAvg: number;
  topProducts: Array<{
    productId: number;
    sku: string;
    quantity: number;
    value: number;
  }>;
  slowMovingCount: number;
  deadStockCount: number;
}

export class InventoryService {
  /**
   * Update inventory on receiving
   */
  static async receiveInventory(params: {
    productId: number;
    sku: string;
    quantity: number;
    unitCost: number;
    receivingId: number;
    receivingNumber: string;
    location?: string;
    userId: number;
  }): Promise<{ success: boolean; newQuantity: number; newValue: number }> {
    // This would interact with database in real implementation
    // For now, returning mock data structure

    const currentQty = 100; // Mock current quantity
    const currentAvgCost = 1500; // Mock current avg cost in cents
    const newQty = currentQty + params.quantity;

    // Calculate new weighted average cost
    const currentValue = currentQty * currentAvgCost;
    const addedValue = params.quantity * params.unitCost;
    const newAvgCost = Math.round((currentValue + addedValue) / newQty);
    const newValue = newQty * newAvgCost;

    // Record transaction
    const transaction: Partial<InventoryTransaction> = {
      productId: params.productId,
      sku: params.sku,
      transactionType: 'purchase',
      quantity: params.quantity,
      quantityBefore: currentQty,
      quantityAfter: newQty,
      unitCost: params.unitCost,
      totalCost: addedValue,
      referenceType: 'receiving',
      referenceId: params.receivingId,
      referenceNumber: params.receivingNumber,
      toLocation: params.location,
      createdBy: params.userId,
      createdAt: new Date(),
    };

    return {
      success: true,
      newQuantity: newQty,
      newValue,
    };
  }

  /**
   * Deduct inventory on order fulfillment
   */
  static async fulfillOrder(params: {
    items: Array<{
      productId: number;
      sku: string;
      quantity: number;
    }>;
    orderId: number;
    orderNumber: string;
    userId: number;
  }): Promise<{ success: boolean; insufficientStock: string[] }> {
    const insufficientStock: string[] = [];

    for (const item of params.items) {
      // Check available quantity
      const available = 50; // Mock available quantity

      if (available < item.quantity) {
        insufficientStock.push(item.sku);
        continue;
      }

      // Record transaction
      const transaction: Partial<InventoryTransaction> = {
        productId: item.productId,
        sku: item.sku,
        transactionType: 'sale',
        quantity: -item.quantity,
        quantityBefore: available,
        quantityAfter: available - item.quantity,
        referenceType: 'order',
        referenceId: params.orderId,
        referenceNumber: params.orderNumber,
        createdBy: params.userId,
        createdAt: new Date(),
      };
    }

    return {
      success: insufficientStock.length === 0,
      insufficientStock,
    };
  }

  /**
   * Manual inventory adjustment
   */
  static async adjustInventory(params: {
    productId: number;
    sku: string;
    newQuantity: number;
    reason: string;
    location?: string;
    userId: number;
  }): Promise<{ success: boolean; adjustment: number }> {
    const currentQty = 100; // Mock current quantity
    const adjustment = params.newQuantity - currentQty;

    const transaction: Partial<InventoryTransaction> = {
      productId: params.productId,
      sku: params.sku,
      transactionType: 'adjustment',
      quantity: adjustment,
      quantityBefore: currentQty,
      quantityAfter: params.newQuantity,
      notes: params.reason,
      toLocation: params.location,
      createdBy: params.userId,
      createdAt: new Date(),
    };

    return {
      success: true,
      adjustment,
    };
  }

  /**
   * Transfer inventory between locations
   */
  static async transferInventory(params: {
    productId: number;
    sku: string;
    quantity: number;
    fromLocation: string;
    toLocation: string;
    userId: number;
  }): Promise<{ success: boolean }> {
    const transaction: Partial<InventoryTransaction> = {
      productId: params.productId,
      sku: params.sku,
      transactionType: 'transfer',
      quantity: 0, // Net zero for transfers
      fromLocation: params.fromLocation,
      toLocation: params.toLocation,
      createdBy: params.userId,
      createdAt: new Date(),
    };

    return { success: true };
  }

  /**
   * Get low stock items (below reorder point)
   */
  static async getLowStockItems(): Promise<Array<{
    productId: number;
    sku: string;
    productName: string;
    quantityOnHand: number;
    reorderPoint: number;
    reorderQuantity: number;
    shortage: number;
  }>> {
    // Mock data
    return [
      {
        productId: 1,
        sku: 'PROD-001',
        productName: 'Sample Product',
        quantityOnHand: 5,
        reorderPoint: 10,
        reorderQuantity: 50,
        shortage: 5,
      },
    ];
  }

  /**
   * Calculate inventory valuation using different methods
   */
  static async calculateValuation(params: {
    productId?: number;
    asOfDate?: Date;
  }): Promise<{
    fifo: number;
    lifo: number;
    weightedAverage: number;
    totalQuantity: number;
  }> {
    // In real implementation, this would:
    // 1. Get all purchase transactions
    // 2. Calculate FIFO (first in, first out)
    // 3. Calculate LIFO (last in, first out)
    // 4. Calculate weighted average
    
    return {
      fifo: 150000, // $1,500.00
      lifo: 148000, // $1,480.00
      weightedAverage: 149000, // $1,490.00
      totalQuantity: 100,
    };
  }

  /**
   * Create inventory valuation snapshot
   */
  static async createValuationSnapshot(params: {
    snapshotType: 'daily' | 'weekly' | 'monthly' | 'manual';
    userId?: number;
  }): Promise<ValuationSnapshot> {
    // Mock snapshot
    const snapshot: ValuationSnapshot = {
      snapshotDate: new Date(),
      totalQuantity: 1000,
      totalValue: 1500000, // $15,000.00
      valuationFIFO: 1520000,
      valuationLIFO: 1480000,
      valuationWeightedAvg: 1500000,
      topProducts: [
        {
          productId: 1,
          sku: 'PROD-001',
          quantity: 100,
          value: 150000,
        },
      ],
      slowMovingCount: 5,
      deadStockCount: 2,
    };

    return snapshot;
  }

  /**
   * Get inventory turnover rate
   */
  static async getTurnoverRate(params: {
    productId?: number;
    days?: number;
  }): Promise<{
    turnoverRate: number;
    avgDaysToSell: number;
    totalSold: number;
    avgInventory: number;
  }> {
    return {
      turnoverRate: 4.5, // times per year
      avgDaysToSell: 81, // days
      totalSold: 450,
      avgInventory: 100,
    };
  }

  /**
   * Get inventory aging report
   */
  static async getAgingReport(): Promise<Array<{
    productId: number;
    sku: string;
    productName: string;
    quantity: number;
    value: number;
    daysInStock: number;
    ageCategory: '0-30' | '31-60' | '61-90' | '91-180' | '180+';
  }>> {
    return [
      {
        productId: 1,
        sku: 'PROD-001',
        productName: 'Sample Product',
        quantity: 50,
        value: 75000,
        daysInStock: 45,
        ageCategory: '31-60',
      },
    ];
  }

  /**
   * Allocate inventory for pending order
   */
  static async allocateInventory(params: {
    orderId: number;
    items: Array<{
      productId: number;
      sku: string;
      quantity: number;
    }>;
  }): Promise<{ success: boolean; allocated: string[]; unavailable: string[] }> {
    const allocated: string[] = [];
    const unavailable: string[] = [];

    for (const item of params.items) {
      const available = 50; // Mock available quantity

      if (available >= item.quantity) {
        allocated.push(item.sku);
        // Update quantityAllocated in database
      } else {
        unavailable.push(item.sku);
      }
    }

    return {
      success: unavailable.length === 0,
      allocated,
      unavailable,
    };
  }

  /**
   * Release allocated inventory (order cancelled)
   */
  static async releaseAllocation(params: {
    orderId: number;
  }): Promise<{ success: boolean; released: number }> {
    // Find all allocations for this order and release them
    return {
      success: true,
      released: 3, // number of items released
    };
  }
}
