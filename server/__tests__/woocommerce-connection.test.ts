import { describe, it, expect } from 'vitest';
import { createWooCommerceClient } from '../integrations/woocommerce';

describe('WooCommerce Connection', () => {
  it('should connect to WooCommerce with valid credentials', async () => {
    const client = createWooCommerceClient();
    
    expect(client).not.toBeNull();
    
    if (client) {
      const connected = await client.testConnection();
      expect(connected).toBe(true);
    }
  }, 30000); // 30 second timeout for API call
});
