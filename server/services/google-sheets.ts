/**
 * Google Sheets Integration Service
 * 
 * Syncs shipment data from Google Sheets for multi-source data reconciliation
 */

import { google } from 'googleapis';

interface SheetCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

interface ShipmentRow {
  trackingNumber: string;
  carrier: string;
  serviceType: string;
  shipDate: string;
  deliveryDate?: string;
  quotedCost: number;
  actualCost: number;
  weight: number;
  dimensions?: string;
  recipient: string;
  destination: string;
}

/**
 * Initialize Google Sheets API client
 */
export async function getGoogleSheetsClient(credentials: SheetCredentials) {
  const oauth2Client = new google.auth.OAuth2(
    credentials.clientId,
    credentials.clientSecret,
    'https://oauth2.googleapis.com/token'
  );

  oauth2Client.setCredentials({
    refresh_token: credentials.refreshToken,
  });

  return google.sheets({ version: 'v4', auth: oauth2Client });
}

/**
 * Read shipment data from Google Sheet
 */
export async function readShipmentData(
  credentials: SheetCredentials,
  spreadsheetId: string,
  range: string = 'Sheet1!A2:M'
): Promise<ShipmentRow[]> {
  try {
    const sheets = await getGoogleSheetsClient(credentials);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    
    return rows.map((row) => ({
      trackingNumber: row[0] || '',
      carrier: row[1] || '',
      serviceType: row[2] || '',
      shipDate: row[3] || '',
      deliveryDate: row[4] || undefined,
      quotedCost: parseFloat(row[5]) || 0,
      actualCost: parseFloat(row[6]) || 0,
      weight: parseFloat(row[7]) || 0,
      dimensions: row[8] || undefined,
      recipient: row[9] || '',
      destination: row[10] || '',
    }));
  } catch (error) {
    console.error('Error reading Google Sheets:', error);
    throw new Error('Failed to read shipment data from Google Sheets');
  }
}

/**
 * Write shipment data to Google Sheet
 */
export async function writeShipmentData(
  credentials: SheetCredentials,
  spreadsheetId: string,
  data: ShipmentRow[],
  range: string = 'Sheet1!A2'
): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient(credentials);
    
    const values = data.map((row) => [
      row.trackingNumber,
      row.carrier,
      row.serviceType,
      row.shipDate,
      row.deliveryDate || '',
      row.quotedCost,
      row.actualCost,
      row.weight,
      row.dimensions || '',
      row.recipient,
      row.destination,
    ]);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });
  } catch (error) {
    console.error('Error writing to Google Sheets:', error);
    throw new Error('Failed to write shipment data to Google Sheets');
  }
}

/**
 * Sync shipment data from Google Sheets to database
 */
export async function syncShipmentsFromSheet(
  credentials: SheetCredentials,
  spreadsheetId: string,
  saveToDatabase: (shipments: ShipmentRow[]) => Promise<void>
): Promise<{ synced: number; errors: number }> {
  try {
    const shipments = await readShipmentData(credentials, spreadsheetId);
    
    await saveToDatabase(shipments);
    
    return {
      synced: shipments.length,
      errors: 0,
    };
  } catch (error) {
    console.error('Error syncing from Google Sheets:', error);
    return {
      synced: 0,
      errors: 1,
    };
  }
}

/**
 * Create a new Google Sheet with shipment template
 */
export async function createShipmentSheet(
  credentials: SheetCredentials,
  title: string = 'Carrier Dispute Shipments'
): Promise<string> {
  try {
    const sheets = await getGoogleSheetsClient(credentials);
    
    const response = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title,
        },
        sheets: [
          {
            properties: {
              title: 'Shipments',
            },
            data: [
              {
                rowData: [
                  {
                    values: [
                      { userEnteredValue: { stringValue: 'Tracking Number' } },
                      { userEnteredValue: { stringValue: 'Carrier' } },
                      { userEnteredValue: { stringValue: 'Service Type' } },
                      { userEnteredValue: { stringValue: 'Ship Date' } },
                      { userEnteredValue: { stringValue: 'Delivery Date' } },
                      { userEnteredValue: { stringValue: 'Quoted Cost' } },
                      { userEnteredValue: { stringValue: 'Actual Cost' } },
                      { userEnteredValue: { stringValue: 'Weight (lbs)' } },
                      { userEnteredValue: { stringValue: 'Dimensions' } },
                      { userEnteredValue: { stringValue: 'Recipient' } },
                      { userEnteredValue: { stringValue: 'Destination' } },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    return response.data.spreadsheetId || '';
  } catch (error) {
    console.error('Error creating Google Sheet:', error);
    throw new Error('Failed to create shipment tracking sheet');
  }
}
