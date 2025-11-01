import { stringSimilarity } from "string-similarity-js";
import { getDb } from "../db";
import { 
  customerIdentities, 
  customerIdentityMatches,
  InsertCustomerIdentity,
  InsertCustomerIdentityMatch,
  CustomerIdentity 
} from "../../drizzle/schema";
import { eq, or, and, sql } from "drizzle-orm";

/**
 * Customer Identity Resolution Engine
 * 
 * Handles intelligent customer matching across 10+ years of data
 * Supports fuzzy matching, identity merging, and conflict detection
 */

interface MatchResult {
  identity: CustomerIdentity;
  matchType: "exact_email" | "exact_phone" | "fuzzy_name" | "address_overlap" | "manual";
  confidenceScore: number; // 0-100
  matchReason: string;
}

interface IdentitySearchParams {
  email?: string;
  phone?: string;
  name?: string;
  address?: string;
}

export class CustomerIdentityResolver {
  /**
   * Find or create a customer identity
   * Returns existing identity if high-confidence match found, otherwise creates new
   */
  static async findOrCreate(params: IdentitySearchParams, userId: number): Promise<{
    identity: CustomerIdentity;
    isNew: boolean;
    matches: MatchResult[];
  }> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Step 1: Look for exact matches
    const exactMatches = await this.findExactMatches(params);
    
    if (exactMatches.length > 0) {
      // Return first exact match
      return {
        identity: exactMatches[0].identity,
        isNew: false,
        matches: exactMatches,
      };
    }

    // Step 2: Look for fuzzy matches
    const fuzzyMatches = await this.findFuzzyMatches(params);
    
    // Step 3: If high-confidence fuzzy match (>=90%), return it
    const highConfidenceMatch = fuzzyMatches.find(m => m.confidenceScore >= 90);
    if (highConfidenceMatch) {
      return {
        identity: highConfidenceMatch.identity,
        isNew: false,
        matches: fuzzyMatches,
      };
    }

    // Step 4: No high-confidence match found, create new identity
    const newIdentity = await this.createIdentity(params, userId);
    
    // Step 5: Log potential matches for manual review
    if (fuzzyMatches.length > 0) {
      await this.logPotentialMatches(newIdentity.id, fuzzyMatches);
    }

    return {
      identity: newIdentity,
      isNew: true,
      matches: fuzzyMatches,
    };
  }

  /**
   * Find exact matches by email or phone
   */
  private static async findExactMatches(params: IdentitySearchParams): Promise<MatchResult[]> {
    const db = await getDb();
    if (!db) return [];

    const conditions = [];
    
    if (params.email) {
      conditions.push(eq(customerIdentities.email, params.email.toLowerCase().trim()));
    }
    
    if (params.phone) {
      const normalizedPhone = this.normalizePhone(params.phone);
      conditions.push(eq(customerIdentities.phone, normalizedPhone));
    }

    if (conditions.length === 0) return [];

    const results = await db
      .select()
      .from(customerIdentities)
      .where(or(...conditions));

    return results.map(identity => {
      let matchType: MatchResult["matchType"] = "exact_email";
      let matchReason = "";

      if (params.email && identity.email === params.email.toLowerCase().trim()) {
        matchType = "exact_email";
        matchReason = `Exact email match: ${identity.email}`;
      } else if (params.phone && identity.phone === this.normalizePhone(params.phone)) {
        matchType = "exact_phone";
        matchReason = `Exact phone match: ${identity.phone}`;
      }

      return {
        identity,
        matchType,
        confidenceScore: 100,
        matchReason,
      };
    });
  }

  /**
   * Find fuzzy matches by name and address similarity
   */
  private static async findFuzzyMatches(params: IdentitySearchParams): Promise<MatchResult[]> {
    const db = await getDb();
    if (!db || !params.name) return [];

    // Get all identities (with limit for performance)
    const allIdentities = await db
      .select()
      .from(customerIdentities)
      .limit(1000); // Limit for performance

    const matches: MatchResult[] = [];

    for (const identity of allIdentities) {
      const nameSimilarity = stringSimilarity(
        params.name.toLowerCase(),
        identity.name.toLowerCase()
      );

      // Name similarity threshold: 0.8 (80%)
      if (nameSimilarity >= 0.8) {
        let confidenceScore = Math.round(nameSimilarity * 100);
        let matchReason = `Name similarity: ${Math.round(nameSimilarity * 100)}%`;

        // Boost confidence if address overlaps
        if (params.address && identity.currentAddress) {
          const addressSimilarity = stringSimilarity(
            params.address.toLowerCase(),
            identity.currentAddress.toLowerCase()
          );

          if (addressSimilarity >= 0.7) {
            confidenceScore = Math.min(100, confidenceScore + 10);
            matchReason += ` + Address overlap: ${Math.round(addressSimilarity * 100)}%`;
          }
        }

        // Check address history
        if (params.address && identity.addressHistory) {
          try {
            const addressHistory = JSON.parse(identity.addressHistory);
            for (const historicalAddress of addressHistory) {
              const historicalSimilarity = stringSimilarity(
                params.address.toLowerCase(),
                historicalAddress.toLowerCase()
              );

              if (historicalSimilarity >= 0.7) {
                confidenceScore = Math.min(100, confidenceScore + 5);
                matchReason += ` + Historical address match`;
                break;
              }
            }
          } catch (e) {
            // Invalid JSON, skip
          }
        }

        matches.push({
          identity,
          matchType: "fuzzy_name",
          confidenceScore,
          matchReason,
        });
      }
    }

    // Sort by confidence score descending
    return matches.sort((a, b) => b.confidenceScore - a.confidenceScore);
  }

  /**
   * Create a new customer identity
   */
  private static async createIdentity(
    params: IdentitySearchParams,
    userId: number
  ): Promise<CustomerIdentity> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const identityData: InsertCustomerIdentity = {
      email: params.email?.toLowerCase().trim() || null,
      phone: params.phone ? this.normalizePhone(params.phone) : null,
      name: params.name || "Unknown",
      currentAddress: params.address || null,
      addressHistory: params.address ? JSON.stringify([params.address]) : null,
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
      totalOrders: 0,
      lifetimeValue: 0,
      disputeCount: 0,
    };

    const [newIdentity] = await db.insert(customerIdentities).values(identityData);
    
    // Fetch the created identity
    const [created] = await db
      .select()
      .from(customerIdentities)
      .where(eq(customerIdentities.id, newIdentity.insertId));

    return created;
  }

  /**
   * Log potential matches for manual review
   */
  private static async logPotentialMatches(
    newIdentityId: number,
    matches: MatchResult[]
  ): Promise<void> {
    const db = await getDb();
    if (!db) return;

    for (const match of matches) {
      // Only log matches with confidence >= 50%
      if (match.confidenceScore >= 50) {
        const matchData: InsertCustomerIdentityMatch = {
          identity1Id: newIdentityId,
          identity2Id: match.identity.id,
          matchType: match.matchType,
          confidenceScore: match.confidenceScore,
          matchReason: match.matchReason,
          status: match.confidenceScore >= 90 ? "auto_merged" : "pending",
        };

        await db.insert(customerIdentityMatches).values(matchData);
      }
    }
  }

  /**
   * Merge two identities (manual or auto)
   */
  static async mergeIdentities(
    keepId: number,
    mergeId: number,
    userId: number
  ): Promise<CustomerIdentity> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get both identities
    const [keep] = await db
      .select()
      .from(customerIdentities)
      .where(eq(customerIdentities.id, keepId));

    const [merge] = await db
      .select()
      .from(customerIdentities)
      .where(eq(customerIdentities.id, mergeId));

    if (!keep || !merge) {
      throw new Error("Identity not found");
    }

    // Merge data
    const mergedAddressHistory = new Set<string>();
    
    if (keep.addressHistory) {
      try {
        const keepHistory = JSON.parse(keep.addressHistory);
        keepHistory.forEach((addr: string) => mergedAddressHistory.add(addr));
      } catch (e) {
        // Invalid JSON
      }
    }

    if (merge.addressHistory) {
      try {
        const mergeHistory = JSON.parse(merge.addressHistory);
        mergeHistory.forEach((addr: string) => mergedAddressHistory.add(addr));
      } catch (e) {
        // Invalid JSON
      }
    }

    if (merge.currentAddress) {
      mergedAddressHistory.add(merge.currentAddress);
    }

    // Update keep identity with merged data
    await db
      .update(customerIdentities)
      .set({
        totalOrders: keep.totalOrders + merge.totalOrders,
        lifetimeValue: keep.lifetimeValue + merge.lifetimeValue,
        disputeCount: keep.disputeCount + merge.disputeCount,
        addressHistory: JSON.stringify(Array.from(mergedAddressHistory)),
        firstSeenAt: keep.firstSeenAt < merge.firstSeenAt ? keep.firstSeenAt : merge.firstSeenAt,
        lastSeenAt: new Date(),
      })
      .where(eq(customerIdentities.id, keepId));

    // Mark merged identity as merged
    await db
      .update(customerIdentities)
      .set({
        masterIdentityId: keepId,
        mergedAt: new Date(),
        mergedBy: userId,
      })
      .where(eq(customerIdentities.id, mergeId));

    // Get updated identity
    const [updated] = await db
      .select()
      .from(customerIdentities)
      .where(eq(customerIdentities.id, keepId));

    return updated;
  }

  /**
   * Get identity with all historical data
   */
  static async getIdentityWithHistory(identityId: number): Promise<{
    identity: CustomerIdentity;
    addressHistory: string[];
    totalOrders: number;
    lifetimeValue: number;
    disputeCount: number;
  } | null> {
    const db = await getDb();
    if (!db) return null;

    const [identity] = await db
      .select()
      .from(customerIdentities)
      .where(eq(customerIdentities.id, identityId));

    if (!identity) return null;

    let addressHistory: string[] = [];
    if (identity.addressHistory) {
      try {
        addressHistory = JSON.parse(identity.addressHistory);
      } catch (e) {
        addressHistory = [];
      }
    }

    return {
      identity,
      addressHistory,
      totalOrders: identity.totalOrders,
      lifetimeValue: identity.lifetimeValue,
      disputeCount: identity.disputeCount,
    };
  }

  /**
   * Get pending identity matches for manual review
   */
  static async getPendingMatches(limit: number = 50): Promise<Array<{
    match: typeof customerIdentityMatches.$inferSelect;
    identity1: CustomerIdentity;
    identity2: CustomerIdentity;
  }>> {
    const db = await getDb();
    if (!db) return [];

    const matches = await db
      .select()
      .from(customerIdentityMatches)
      .where(eq(customerIdentityMatches.status, "pending"))
      .limit(limit);

    const results = [];

    for (const match of matches) {
      const [identity1] = await db
        .select()
        .from(customerIdentities)
        .where(eq(customerIdentities.id, match.identity1Id));

      const [identity2] = await db
        .select()
        .from(customerIdentities)
        .where(eq(customerIdentities.id, match.identity2Id));

      if (identity1 && identity2) {
        results.push({ match, identity1, identity2 });
      }
    }

    return results;
  }

  /**
   * Normalize phone number for matching
   */
  private static normalizePhone(phone: string): string {
    // Remove all non-digit characters
    return phone.replace(/\D/g, "");
  }

  /**
   * Update identity stats (orders, LTV, disputes)
   */
  static async updateIdentityStats(
    identityId: number,
    stats: {
      totalOrders?: number;
      lifetimeValue?: number;
      disputeCount?: number;
    }
  ): Promise<void> {
    const db = await getDb();
    if (!db) return;

    await db
      .update(customerIdentities)
      .set({
        ...stats,
        lastSeenAt: new Date(),
      })
      .where(eq(customerIdentities.id, identityId));
  }
}
