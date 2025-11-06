/**
 * Google Sheets Service
 * Integration with Google Sheets for shipment data
 */

import { google } from 'googleapis';
import { getDb } from '../db';
import { eq } from 'drizzle-orm';
import { credentialsVault } from '../../drizzle/schema';

const SPREADSHEET_ID = '1mwFndOWqLLmBJnKllvmZBP6-Qhe3q6qdYlBBO2IIjuU';
const SHEET_NAME = 'Sheet1'; // Adjust if needed

interface ShipmentRow {
  trackingNumber?: string;
  carrier?: string;
  service?: string;
  orderNumber?: string;
  customerName?: string;
  shipDate?: string;
  deliveryDate?: string;
  weight?: string;
  cost?: string;
  status?: string;
  [key: string]: any;
}

/**
 * Get Google Sheets API client with OAuth credentials
 */
async function getSheetsClient() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get Google OAuth credentials from vault
  const [creds] = await db
    .select()
    .from(credentialsVault)
    .where(eq(credentialsVault.serviceName, 'GOOGLE'))
    .limit(1);

  if (!creds || !creds.credentialKey) {
    throw new Error("Google OAuth credentials not found. Please configure in Settings.");
  }

  // Parse OAuth credentials
  const oauthCreds = JSON.parse(creds.credentialKey);
  
  const auth = new google.auth.OAuth2(
    oauthCreds.client_id,
    oauthCreds.client_secret,
    oauthCreds.redirect_uri
  );

  auth.setCredentials({
    access_token: oauthCreds.access_token,
    refresh_token: oauthCreds.refresh_token,
  });

  return google.sheets({ version: 'v4', auth });
}

/**
 * Read shipment data from Google Sheets
 */
export async function readShipmentData(): Promise<ShipmentRow[]> {
  try {
    const sheets = await getSheetsClient();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:Z`, // Read all columns
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    // First row is headers
    const headers = rows[0].map((h: string) => h.trim().toLowerCase().replace(/\s+/g, '_'));
    const data: ShipmentRow[] = [];

    // Parse remaining rows
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const shipment: ShipmentRow = {};
      
      headers.forEach((header: string, index: number) => {
        shipment[header] = row[index] || '';
      });

      data.push(shipment);
    }

    return data;
  } catch (error: any) {
    console.error('[Google Sheets] Error reading data:', error);
    throw new Error(`Failed to read Google Sheets: ${error.message}`);
  }
}

/**
 * Sync shipment data from Google Sheets to database
 */
export async function syncShipmentData(userId: number): Promise<{
  success: boolean;
  imported: number;
  updated: number;
  errors: number;
}> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const shipments = await readShipmentData();
    let imported = 0;
    let updated = 0;
    let errors = 0;

    for (const shipment of shipments) {
      try {
        // Store in shipmentData table
        const { createShipmentData } = await import('../db');
        
        await createShipmentData({
          trackingNumber: shipment.tracking_number || shipment.tracking || null,
          carrier: shipment.carrier || null,
          service: shipment.service || null,
          orderNumber: shipment.order_number || shipment.order || null,
          customerName: shipment.customer_name || shipment.customer || null,
          shipDate: shipment.ship_date ? new Date(shipment.ship_date) : null,
          deliveryDate: shipment.delivery_date ? new Date(shipment.delivery_date) : null,
          weight: shipment.weight ? parseFloat(shipment.weight) : null,
          cost: shipment.cost ? parseFloat(shipment.cost.replace(/[^0-9.]/g, '')) : null,
          status: shipment.status || null,
          source: 'GOOGLE_SHEETS',
          sourceId: SPREADSHEET_ID,
          rawData: JSON.stringify(shipment),
        });

        imported++;
      } catch (error) {
        console.error('[Google Sheets] Error importing row:', error);
        errors++;
      }
    }

    return {
      success: true,
      imported,
      updated,
      errors,
    };
  } catch (error: any) {
    console.error('[Google Sheets] Sync error:', error);
    return {
      success: false,
      imported: 0,
      updated: 0,
      errors: 1,
    };
  }
}

/**
 * Get OAuth authorization URL for Google Sheets
 */
export function getGoogleAuthUrl(clientId: string, redirectUri: string): string {
  const auth = new google.auth.OAuth2(clientId, '', redirectUri);
  
  return auth.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      'https://www.googleapis.com/auth/drive.readonly',
    ],
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeGoogleAuthCode(
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  code: string
) {
  const auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  const { tokens } = await auth.getToken(code);
  return tokens;
}
