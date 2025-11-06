/**
 * Integrations Router
 * Handles testing and managing third-party service connections
 */

import { router, protectedProcedure } from '../_core/trpc';
import { testWooCommerceConnection } from '../integrations/woocommerce';
import { createShipStationClient } from '../integrations/shipstation';

export const integrationsRouter = router({
  /**
   * Test ShipStation connection
   */
  testShipStation: protectedProcedure.mutation(async () => {
    try {
      const client = createShipStationClient();
      if (!client) {
        return {
          connected: false,
          error: 'ShipStation credentials not configured',
        };
      }

      // Try to fetch stores as a connection test
      const stores = await client.getStores();
      return {
        connected: true,
        storesCount: stores.length,
      };
    } catch (error: any) {
      return {
        connected: false,
        error: error.message,
      };
    }
  }),

  /**
   * Test WooCommerce connection
   */
  testWooCommerce: protectedProcedure.mutation(async () => {
    return await testWooCommerceConnection();
  }),

  /**
   * Test Klaviyo connection
   */
  testKlaviyo: protectedProcedure.mutation(async () => {
    try {
      const apiKey = process.env.KLAVIYO_API_KEY;
      if (!apiKey) {
        return {
          connected: false,
          error: 'Klaviyo API key not configured',
        };
      }

      // Test API call to Klaviyo
      const response = await fetch('https://a.klaviyo.com/api/accounts/', {
        headers: {
          'Authorization': `Klaviyo-API-Key ${apiKey}`,
          'revision': '2024-10-15',
        },
      });

      if (!response.ok) {
        return {
          connected: false,
          error: `Klaviyo API error: ${response.status}`,
        };
      }

      return {
        connected: true,
      };
    } catch (error: any) {
      return {
        connected: false,
        error: error.message,
      };
    }
  }),

  /**
   * Test Re:amaze connection
   */
  testReamaze: protectedProcedure.mutation(async () => {
    try {
      const brand = process.env.REAMAZE_BRAND;
      const apiKey = process.env.REAMAZE_API_KEY;
      
      if (!brand || !apiKey) {
        return {
          connected: false,
          error: 'Re:amaze credentials not configured',
        };
      }

      // Test API call to Re:amaze
      const response = await fetch(`https://${brand}.reamaze.io/api/v1/articles`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${apiKey}:x`).toString('base64')}`,
        },
      });

      if (!response.ok) {
        return {
          connected: false,
          error: `Re:amaze API error: ${response.status}`,
        };
      }

      return {
        connected: true,
      };
    } catch (error: any) {
      return {
        connected: false,
        error: error.message,
      };
    }
  }),

  /**
   * Test OpenAI connection
   */
  testOpenAI: protectedProcedure.mutation(async () => {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return {
          connected: false,
          error: 'OpenAI API key not configured',
        };
      }

      // Test API call to OpenAI
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        return {
          connected: false,
          error: `OpenAI API error: ${response.status}`,
        };
      }

      return {
        connected: true,
      };
    } catch (error: any) {
      return {
        connected: false,
        error: error.message,
      };
    }
  }),
});
