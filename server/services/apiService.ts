/**
 * API Service Layer
 * Abstraction for all third-party API integrations
 */

import { credentialsVault } from "../../drizzle/schema";
import { getDb } from "../db";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

// Encryption configuration
const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString("hex");

/**
 * Encrypt credential value
 */
export function encryptCredential(value: string): { encrypted: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    ENCRYPTION_ALGORITHM,
    Buffer.from(ENCRYPTION_KEY.slice(0, 64), "hex"),
    iv
  );

  let encrypted = cipher.update(value, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
  };
}

/**
 * Decrypt credential value
 */
export function decryptCredential(encrypted: string, iv: string, tag: string): string {
  const decipher = crypto.createDecipheriv(
    ENCRYPTION_ALGORITHM,
    Buffer.from(ENCRYPTION_KEY.slice(0, 64), "hex"),
    Buffer.from(iv, "hex")
  );

  decipher.setAuthTag(Buffer.from(tag, "hex"));

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Get credentials for a service
 */
export async function getServiceCredentials(
  serviceType: string,
  serviceName?: string
): Promise<Record<string, string>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const query = serviceName
    ? and(
        eq(credentialsVault.serviceType, serviceType as any),
        eq(credentialsVault.serviceName, serviceName),
        eq(credentialsVault.isActive, 1)
      )
    : and(
        eq(credentialsVault.serviceType, serviceType as any),
        eq(credentialsVault.isActive, 1)
      );

  const credentials = await db.select().from(credentialsVault).where(query);

  const result: Record<string, string> = {};

  for (const cred of credentials) {
    try {
      let jsonValue: any;
      
      // Check if credentialValue is already an object (from database)
      if (typeof cred.credentialValue === 'object' && cred.credentialValue !== null) {
        jsonValue = cred.credentialValue;
      } else {
        // Try to parse as JSON string
        try {
          jsonValue = JSON.parse(cred.credentialValue);
        } catch (e) {
          // Not JSON, will try colon-separated format below
        }
      }
      
      // If we have a JSON object with encryption fields, decrypt it
      if (jsonValue && jsonValue.encrypted && jsonValue.iv && jsonValue.tag) {
        try {
          const decrypted = decryptCredential(jsonValue.encrypted, jsonValue.iv, jsonValue.tag);
          result[cred.credentialKey] = decrypted;
          console.log(`[Decrypt] Successfully decrypted ${cred.credentialKey}: ${decrypted.substring(0, 20)}...`);
          continue;
        } catch (decryptError) {
          console.error(`[Decrypt] Failed to decrypt ${cred.credentialKey}:`, decryptError.message);
          // Don't continue, try other formats
        }
      }

      // Parse encrypted value (format: encrypted:iv:tag)
      const parts = cred.credentialValue.split(":");
      if (parts.length === 3) {
        const decrypted = decryptCredential(parts[0], parts[1], parts[2]);
        result[cred.credentialKey] = decrypted;
      } else {
        // Fallback for unencrypted values (migration scenario)
        result[cred.credentialKey] = cred.credentialValue;
      }
    } catch (error) {
      console.error(`Failed to decrypt credential ${cred.id}:`, error);
    }
  }

  return result;
}

/**
 * Save credentials for a service
 */
export async function saveServiceCredentials(
  serviceType: string,
  serviceName: string,
  credentials: Record<string, string>,
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  for (const [key, value] of Object.entries(credentials)) {
    const { encrypted, iv, tag } = encryptCredential(value);
    const encryptedValue = `${encrypted}:${iv}:${tag}`;

    // Check if credential exists
    const existing = await db
      .select()
      .from(credentialsVault)
      .where(
        and(
          eq(credentialsVault.serviceType, serviceType as any),
          eq(credentialsVault.serviceName, serviceName),
          eq(credentialsVault.credentialKey, key)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing
      await db
        .update(credentialsVault)
        .set({
          credentialValue: encryptedValue,
          updatedAt: new Date(),
        })
        .where(eq(credentialsVault.id, existing[0].id));
    } else {
      // Insert new
      await db.insert(credentialsVault).values({
        serviceType: serviceType as any,
        serviceName,
        credentialKey: key,
        credentialValue: encryptedValue,
        createdBy: userId,
        isActive: 1,
      });
    }
  }
}

/**
 * Test service credentials
 */
export async function testServiceCredentials(
  serviceType: string,
  serviceName: string
): Promise<{ success: boolean; message: string }> {
  try {
    const credentials = await getServiceCredentials(serviceType, serviceName);

    switch (serviceType) {
      case "SHIPSTATION":
        return await testShipStationCredentials(credentials);
      case "WOOCOMMERCE":
        return await testWooCommerceCredentials(credentials);
      case "ZOHO_DESK":
        return await testZohoDeskCredentials(credentials);
      case "OPENAI":
        return await testOpenAICredentials(credentials);
      default:
        return { success: false, message: "Unknown service type" };
    }
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

async function testShipStationCredentials(
  credentials: Record<string, string>
): Promise<{ success: boolean; message: string }> {
  const { api_key, api_secret } = credentials;
  if (!api_key || !api_secret) {
    return { success: false, message: "Missing API key or secret" };
  }

  try {
    const auth = Buffer.from(`${api_key}:${api_secret}`).toString("base64");
    const response = await fetch("https://ssapi.shipstation.com/accounts/listtags", {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    if (response.ok) {
      return { success: true, message: "ShipStation credentials verified" };
    } else {
      return { success: false, message: `Authentication failed: ${response.statusText}` };
    }
  } catch (error: any) {
    return { success: false, message: `Connection error: ${error.message}` };
  }
}

async function testWooCommerceCredentials(
  credentials: Record<string, string>
): Promise<{ success: boolean; message: string }> {
  const { store_url, consumer_key, consumer_secret } = credentials;
  if (!store_url || !consumer_key || !consumer_secret) {
    return { success: false, message: "Missing store URL or credentials" };
  }

  try {
    const auth = Buffer.from(`${consumer_key}:${consumer_secret}`).toString("base64");
    const response = await fetch(`${store_url}/wp-json/wc/v3/system_status`, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    if (response.ok) {
      return { success: true, message: "WooCommerce credentials verified" };
    } else {
      return { success: false, message: `Authentication failed: ${response.statusText}` };
    }
  } catch (error: any) {
    return { success: false, message: `Connection error: ${error.message}` };
  }
}

async function testZohoDeskCredentials(
  credentials: Record<string, string>
): Promise<{ success: boolean; message: string }> {
  const { org_id, access_token } = credentials;
  if (!org_id || !access_token) {
    return { success: false, message: "Missing organization ID or access token" };
  }

  try {
    const response = await fetch(`https://desk.zoho.com/api/v1/departments`, {
      headers: {
        Authorization: `Zoho-oauthtoken ${access_token}`,
        orgId: org_id,
      },
    });

    if (response.ok) {
      return { success: true, message: "Zoho Desk credentials verified" };
    } else {
      return { success: false, message: `Authentication failed: ${response.statusText}` };
    }
  } catch (error: any) {
    return { success: false, message: `Connection error: ${error.message}` };
  }
}

async function testOpenAICredentials(
  credentials: Record<string, string>
): Promise<{ success: boolean; message: string }> {
  const { api_key } = credentials;
  if (!api_key) {
    return { success: false, message: "Missing API key" };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${api_key}`,
      },
    });

    if (response.ok) {
      return { success: true, message: "OpenAI credentials verified" };
    } else {
      return { success: false, message: `Authentication failed: ${response.statusText}` };
    }
  } catch (error: any) {
    return { success: false, message: `Connection error: ${error.message}` };
  }
}
