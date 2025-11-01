import { getDb } from '../db';
import { customers } from '../../drizzle/schema';
import { eq, or, like, sql } from 'drizzle-orm';

export class CustomerService {
  /**
   * Normalize address for matching
   */
  private normalizeAddress(address: string): string {
    return address
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\b(street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|court|ct|place|pl|apartment|apt|suite|ste|unit)\b/g, '') // Remove common abbreviations
      .trim();
  }

  /**
   * Find customer by address
   */
  async findByAddress(address: {
    addressLine1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  }): Promise<any | null> {
    const db = await getDb();
    if (!db) return null;

    // Try exact postal code match first
    if (address.postalCode) {
      const exactMatch = await db
        .select()
        .from(customers)
        .where(eq(customers.postalCode, address.postalCode))
        .limit(1);

      if (exactMatch.length > 0) {
        return exactMatch[0];
      }
    }

    // Try normalized address match
    if (address.addressLine1) {
      const normalized = this.normalizeAddress(address.addressLine1);
      
      const matches = await db
        .select()
        .from(customers)
        .where(
          or(
            like(customers.normalizedAddress, `%${normalized}%`),
            like(customers.addressLine1, `%${address.addressLine1}%`)
          )
        )
        .limit(5);

      if (matches.length > 0) {
        // Return best match (first one for now)
        return matches[0];
      }
    }

    return null;
  }

  /**
   * Find customer by email
   */
  async findByEmail(email: string): Promise<any | null> {
    const db = await getDb();
    if (!db) return null;

    const result = await db
      .select()
      .from(customers)
      .where(eq(customers.email, email))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Find customer by phone
   */
  async findByPhone(phone: string): Promise<any | null> {
    const db = await getDb();
    if (!db) return null;

    // Normalize phone number (remove non-digits)
    const normalizedPhone = phone.replace(/\D/g, '');

    const result = await db
      .select()
      .from(customers)
      .where(like(customers.phone, `%${normalizedPhone}%`))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Create or update customer
   */
  async upsertCustomer(data: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    source?: string;
    externalId?: string;
  }): Promise<number> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Normalize address for matching
    let normalizedAddress = null;
    if (data.addressLine1) {
      normalizedAddress = this.normalizeAddress(
        `${data.addressLine1} ${data.city || ''} ${data.state || ''} ${data.postalCode || ''}`
      );
    }

    // Check if customer exists
    let existingCustomer = null;
    if (data.email) {
      existingCustomer = await this.findByEmail(data.email);
    } else if (data.phone) {
      existingCustomer = await this.findByPhone(data.phone);
    } else if (data.addressLine1) {
      existingCustomer = await this.findByAddress({
        addressLine1: data.addressLine1,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
      });
    }

    if (existingCustomer) {
      // Update existing customer
      await db
        .update(customers)
        .set({
          ...data,
          normalizedAddress,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, existingCustomer.id));

      return existingCustomer.id;
    } else {
      // Create new customer
      const result = await db.insert(customers).values({
        ...data,
        normalizedAddress,
      });

      return result[0].insertId;
    }
  }

  /**
   * Get customer by ID
   */
  async getById(id: number): Promise<any | null> {
    const db = await getDb();
    if (!db) return null;

    const result = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Increment customer dispute count
   */
  async incrementDisputeCount(customerId: number): Promise<void> {
    const db = await getDb();
    if (!db) return;

    await db
      .update(customers)
      .set({
        totalDisputes: sql`${customers.totalDisputes} + 1`,
      })
      .where(eq(customers.id, customerId));
  }

  /**
   * Search customers
   */
  async search(query: string, limit = 10): Promise<any[]> {
    const db = await getDb();
    if (!db) return [];

    const results = await db
      .select()
      .from(customers)
      .where(
        or(
          like(customers.email, `%${query}%`),
          like(customers.firstName, `%${query}%`),
          like(customers.lastName, `%${query}%`),
          like(customers.companyName, `%${query}%`),
          like(customers.addressLine1, `%${query}%`),
          like(customers.city, `%${query}%`),
          like(customers.postalCode, `%${query}%`)
        )
      )
      .limit(limit);

    return results;
  }

  /**
   * Parse address from shipping label data
   */
  parseAddress(shipTo: any): {
    firstName?: string;
    lastName?: string;
    companyName?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  } {
    if (!shipTo) return {};

    // Parse name
    let firstName, lastName, companyName;
    if (shipTo.name) {
      const nameParts = shipTo.name.trim().split(' ');
      if (nameParts.length === 1) {
        companyName = nameParts[0];
      } else {
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ');
      }
    }

    // Parse address
    const addressParts = shipTo.address ? shipTo.address.split(',').map((s: string) => s.trim()) : [];
    
    let addressLine1, city, state, postalCode, country = 'US';
    
    if (addressParts.length >= 3) {
      addressLine1 = addressParts[0];
      city = addressParts[1];
      
      // Last part usually contains state and zip
      const lastPart = addressParts[addressParts.length - 1];
      const stateZipMatch = lastPart.match(/([A-Z]{2})\s+(\d{5}(-\d{4})?)/);
      if (stateZipMatch) {
        state = stateZipMatch[1];
        postalCode = stateZipMatch[2];
      }
    } else if (addressParts.length === 2) {
      addressLine1 = addressParts[0];
      city = addressParts[1];
    } else if (addressParts.length === 1) {
      addressLine1 = addressParts[0];
    }

    return {
      firstName,
      lastName,
      companyName,
      addressLine1,
      city,
      state,
      postalCode,
      country,
    };
  }
}

// Singleton instance
export const customerService = new CustomerService();
