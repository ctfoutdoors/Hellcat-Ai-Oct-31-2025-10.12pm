/**
 * Stores Router
 * Handles fetching ShipStation stores/channels for dynamic menu generation
 */

import { router, protectedProcedure } from '../_core/trpc';
import { createShipStationClient } from '../integrations/shipstation';

export const storesRouter = router({
  /**
   * Get all ShipStation stores/channels
   */
  listShipStationStores: protectedProcedure.query(async () => {
    try {
      const client = createShipStationClient();
      if (!client) {
        return {
          success: false,
          stores: [],
          error: 'ShipStation not configured',
        };
      }

      const stores = await client.getStores();
      
      // Map stores to menu-friendly format
      const formattedStores = stores.map((store: any) => ({
        storeId: store.storeId,
        storeName: store.storeName,
        marketplaceName: store.marketplaceName,
        active: store.active,
        // Generate URL-friendly slug
        slug: store.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      }));

      return {
        success: true,
        stores: formattedStores,
      };
    } catch (error: any) {
      console.error('[Stores] Failed to fetch ShipStation stores:', error);
      return {
        success: false,
        stores: [],
        error: error.message,
      };
    }
  }),
});
