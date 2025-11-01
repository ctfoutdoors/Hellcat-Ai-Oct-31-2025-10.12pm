import { Router } from 'express';
import { getShipmentByTracking } from '../services/shipstationService';
import { getDb } from '../db';
import { orders, shipmentData } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * Look up shipment data with cascading fallback:
 * 1. Try ShipStation API first (live data)
 * 2. Fallback to orders table (synced from ShipStation/WooCommerce)
 * 3. Fallback to shipmentData table (multi-source reconciled data)
 * GET /api/shipstation/lookup?tracking={trackingNumber}
 */
router.get('/lookup', async (req, res) => {
  try {
    const { tracking } = req.query;
    
    if (!tracking || typeof tracking !== 'string') {
      return res.status(400).json({ error: 'Tracking number is required' });
    }
    
    let shipment: any = null;
    let dataSource = '';
    let isPartial = false;
    
    // Try ShipStation API first (live data)
    try {
      shipment = await getShipmentByTracking(tracking);
      if (shipment) {
        dataSource = 'ShipStation API (Live)';
        console.log(`✓ Found shipment in ShipStation API: ${tracking}`);
      }
    } catch (error) {
      console.log('⚠ ShipStation API unavailable, trying database fallback...');
    }
    
    // Fallback to orders table (synced data from ShipStation/WooCommerce)
    if (!shipment) {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error('Database not available');
        }
        const orderResults = await db.select().from(orders)
          .where(eq(orders.trackingNumber, tracking))
          .limit(1);
        
        if (orderResults.length > 0) {
          const order = orderResults[0];
          shipment = {
            trackingNumber: order.trackingNumber,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            serviceCode: order.serviceType || 'Unknown',
            shipmentCost: order.shippingCost ? order.shippingCost / 100 : 0,
            carrier: order.carrier,
            shipDate: order.shipDate,
            orderTotal: order.orderTotal ? order.orderTotal / 100 : 0,
          };
          dataSource = order.syncedFromShipstation ? 'Orders Database (ShipStation Sync)' : 'Orders Database (WooCommerce)';
          isPartial = true;
          console.log(`✓ Found order in database: ${tracking} (source: ${dataSource})`);
        }
      } catch (error) {
        console.log('⚠ Orders database lookup failed, trying shipment data...');
      }
    }
    
    // Fallback to shipmentData table (multi-source reconciled data)
    if (!shipment) {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error('Database not available');
        }
        const shipmentResults = await db.select().from(shipmentData)
          .where(eq(shipmentData.trackingNumber, tracking))
          .limit(1);
        
        if (shipmentResults.length > 0) {
          const data = shipmentResults[0];
          shipment = {
            trackingNumber: data.trackingNumber,
            orderId: data.orderId,
            customerName: data.customerName,
            serviceCode: data.serviceType || 'Unknown',
            carrier: data.carrier,
            shipmentCost: data.actualAmount ? data.actualAmount / 100 : (data.quotedAmount ? data.quotedAmount / 100 : 0),
            weight: data.weight,
            dimensions: data.dimensions,
            hasConflict: data.hasConflict === 1,
            conflictDetails: data.conflictDetails,
          };
          dataSource = 'Shipment Data (Multi-Source Reconciliation)';
          isPartial = true;
          console.log(`✓ Found shipment in reconciled data: ${tracking}`);
          
          if (data.hasConflict) {
            console.log(`⚠ Warning: This shipment has data conflicts between sources`);
          }
        }
      } catch (error) {
        console.log('⚠ Shipment data lookup failed');
      }
    }
    
    if (!shipment) {
      return res.status(404).json({ 
        error: 'Shipment not found',
        message: 'Unable to find tracking number in ShipStation API, orders database, or shipment data',
        tracking: tracking
      });
    }
    
    res.json({
      ...shipment,
      dataSource,
      isPartial,
      warning: isPartial 
        ? `Data retrieved from ${dataSource}. This is cached/synced data. For real-time information, ensure ShipStation API credentials are configured.` 
        : null
    });
  } catch (error) {
    console.error('❌ Lookup error:', error);
    res.status(500).json({ error: 'Failed to lookup shipment' });
  }
});

export default router;
