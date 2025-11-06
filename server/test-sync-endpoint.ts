/**
 * Test endpoint to trigger ShipStation sync
 * Access at: http://localhost:3000/api/test-sync
 */

import { syncOrdersFromShipStation } from './db-shipstation-sync';

export async function handleTestSync(req: any, res: any) {
  try {
    console.log('\n=== Starting ShipStation Sync Test ===\n');
    
    const result = await syncOrdersFromShipStation(30);
    
    console.log('\n=== Sync Complete ===');
    console.log('Orders Processed:', result.ordersProcessed);
    console.log('Orders Created:', result.ordersCreated);
    console.log('Orders Updated:', result.ordersUpdated);
    console.log('Errors:', result.errors.length);
    
    if (result.errors.length > 0) {
      console.log('\nError Details:');
      result.errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }
    
    res.json({
      success: result.success,
      message: 'Sync completed',
      result,
    });
  } catch (error) {
    console.error('\n=== Sync Failed ===');
    console.error('Error:', error);
    
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      error: error instanceof Error ? error.stack : String(error),
    });
  }
}
