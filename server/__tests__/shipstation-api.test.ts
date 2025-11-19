import { describe, it, expect } from 'vitest';
import { createShipStationClient } from '../integrations/shipstation';

describe('ShipStation API Integration', () => {
  it('should connect to ShipStation API', async () => {
    const client = createShipStationClient();
    expect(client).toBeDefined();
  });

  it('should fetch warehouses', async () => {
    const client = createShipStationClient();
    const warehouses = await client.getWarehouses();
    
    expect(warehouses).toBeDefined();
    expect(Array.isArray(warehouses)).toBe(true);
    
    if (warehouses.length > 0) {
      const warehouse = warehouses[0];
      expect(warehouse).toHaveProperty('warehouseId');
      expect(warehouse).toHaveProperty('warehouseName');
      console.log(`✓ Found ${warehouses.length} warehouse(s)`);
      console.log(`  First warehouse: ${warehouse.warehouseName} (ID: ${warehouse.warehouseId})`);
    } else {
      console.log('⚠ No warehouses found in ShipStation');
    }
  });

  it('should fetch products', async () => {
    const client = createShipStationClient();
    const response = await client.getProducts({ pageSize: 10 });
    
    expect(response).toBeDefined();
    expect(response.products).toBeDefined();
    expect(Array.isArray(response.products)).toBe(true);
    
    console.log(`✓ Found ${response.products.length} product(s)`);
    
    if (response.products.length > 0) {
      const product = response.products[0];
      expect(product).toHaveProperty('productId');
      expect(product).toHaveProperty('sku');
      console.log(`  First product: ${product.name || product.sku} (SKU: ${product.sku})`);
    }
  });

  it('should fetch orders', async () => {
    const client = createShipStationClient();
    
    // Get orders from the last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const response = await client.getOrders({
      createDateStart: startDate.toISOString(),
      createDateEnd: endDate.toISOString(),
      pageSize: 10,
    });
    
    expect(response).toBeDefined();
    expect(response.orders).toBeDefined();
    expect(Array.isArray(response.orders)).toBe(true);
    
    console.log(`✓ Found ${response.orders.length} order(s) in the last 7 days`);
    
    if (response.orders.length > 0) {
      const order = response.orders[0];
      expect(order).toHaveProperty('orderId');
      expect(order).toHaveProperty('orderNumber');
      expect(order).toHaveProperty('orderStatus');
      console.log(`  First order: ${order.orderNumber} (Status: ${order.orderStatus})`);
    }
  });

  it('should fetch today\'s orders', async () => {
    const client = createShipStationClient();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const response = await client.getOrders({
      createDateStart: today.toISOString(),
      createDateEnd: tomorrow.toISOString(),
      pageSize: 100,
    });
    
    expect(response).toBeDefined();
    expect(response.orders).toBeDefined();
    
    console.log(`✓ Found ${response.orders.length} order(s) created today`);
    
    if (response.orders.length > 0) {
      const order = response.orders[0];
      console.log(`  Sample order: ${order.orderNumber} - ${order.shipTo?.name || 'Unknown'} ($${order.orderTotal})`);
    }
  });
});
