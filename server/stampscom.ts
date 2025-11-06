/**
 * Stamps.com SWS/IM SOAP API Client
 * 
 * Provides access to Stamps.com Web Services for retrieving
 * Balance and Transaction Reports containing USPS adjustments.
 */

import { ENV } from "./_core/env";

const STAMPS_STAGING_ENDPOINT = "https://swsim.testing.stamps.com/swsim/swsimv135.asmx";
const STAMPS_PRODUCTION_ENDPOINT = "https://swsim.stamps.com/swsim/swsimv135.asmx";

// Use staging by default, switch to production when ready
const ENDPOINT = process.env.STAMPS_USE_PRODUCTION === "true" 
  ? STAMPS_PRODUCTION_ENDPOINT 
  : STAMPS_STAGING_ENDPOINT;

interface StampsCredentials {
  integrationId: string;
  username: string;
  password: string;
}

interface AuthenticateResponse {
  authenticator: string;
  accountInfo: {
    customerId: string;
    meterNumber: string;
    postageBalance: {
      availablePostage: number;
      controlTotal: number;
    };
  };
}

interface GetURLResponse {
  authenticator: string;
  url: string;
}

export type URLType =
  | "HomePage"
  | "AccountSettingsPage"
  | "EditCostCodesPage"
  | "OnlineReportsPage"
  | "HelpPage"
  | "OnlineReportingHistory"
  | "OnlineReportingRefund"
  | "OnlineReportingPickup"
  | "OnlineReportingSCAN"
  | "OnlineReportingClaim"
  | "ReportsBalances"      // Balance and Transaction Report (contains adjustments)
  | "ReportsExpenses"
  | "ReportsPrints";

/**
 * Parse XML response and extract text content from a tag
 */
function extractXMLValue(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : '';
}

/**
 * Authenticate with Stamps.com API and get authenticator token
 */
export async function authenticateStamps(credentials: StampsCredentials): Promise<AuthenticateResponse> {
  const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:tns="http://stamps.com/xml/namespace/2023/07/swsim/SwsimV135">
  <soap:Body>
    <tns:AuthenticateUser>
      <tns:Credentials>
        <tns:IntegrationID>${credentials.integrationId}</tns:IntegrationID>
        <tns:Username>${credentials.username}</tns:Username>
        <tns:Password>${credentials.password}</tns:Password>
      </tns:Credentials>
    </tns:AuthenticateUser>
  </soap:Body>
</soap:Envelope>`;

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "SOAPAction": "http://stamps.com/xml/namespace/2023/07/swsim/SwsimV135/AuthenticateUser",
    },
    body: soapRequest,
  });

  if (!response.ok) {
    throw new Error(`Stamps.com API error: ${response.status} ${response.statusText}`);
  }

  const xmlResponse = await response.text();
  
  // Parse the SOAP response
  const authenticator = extractXMLValue(xmlResponse, 'Authenticator');
  const customerId = extractXMLValue(xmlResponse, 'CustomerID');
  const meterNumber = extractXMLValue(xmlResponse, 'MeterNumber');
  const availablePostage = parseFloat(extractXMLValue(xmlResponse, 'AvailablePostage') || '0');
  const controlTotal = parseFloat(extractXMLValue(xmlResponse, 'ControlTotal') || '0');

  if (!authenticator) {
    throw new Error('Failed to authenticate with Stamps.com API');
  }

  return {
    authenticator,
    accountInfo: {
      customerId,
      meterNumber,
      postageBalance: {
        availablePostage,
        controlTotal,
      },
    },
  };
}

/**
 * Get authenticated URL to Stamps.com web page
 * 
 * @param authenticator - Token from authenticateStamps()
 * @param urlType - Type of page to access
 * @returns Authenticated URL (valid for one use only, navigate immediately)
 */
export async function getStampsURL(
  authenticator: string,
  urlType: URLType
): Promise<GetURLResponse> {
  const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:tns="http://stamps.com/xml/namespace/2023/07/swsim/SwsimV135">
  <soap:Body>
    <tns:GetURL>
      <tns:Authenticator>${authenticator}</tns:Authenticator>
      <tns:URLType>${urlType}</tns:URLType>
    </tns:GetURL>
  </soap:Body>
</soap:Envelope>`;

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "SOAPAction": "http://stamps.com/xml/namespace/2023/07/swsim/SwsimV135/GetURL",
    },
    body: soapRequest,
  });

  if (!response.ok) {
    throw new Error(`Stamps.com GetURL error: ${response.status} ${response.statusText}`);
  }

  const xmlResponse = await response.text();
  
  const newAuthenticator = extractXMLValue(xmlResponse, 'Authenticator');
  const url = extractXMLValue(xmlResponse, 'URL');

  if (!url) {
    throw new Error('Failed to get URL from Stamps.com API');
  }

  return {
    authenticator: newAuthenticator || authenticator,
    url,
  };
}

/**
 * Get direct URL to Balance and Transaction Report (contains USPS adjustments)
 */
export async function getBalanceReportURL(credentials: StampsCredentials): Promise<string> {
  const { authenticator } = await authenticateStamps(credentials);
  const { url } = await getStampsURL(authenticator, "ReportsBalances");
  return url;
}

/**
 * Get Stamps.com credentials from environment variables
 */
export function getStampsCredentials(): StampsCredentials {
  const integrationId = process.env.STAMPS_INTEGRATION_ID;
  const username = process.env.STAMPS_USERNAME;
  const password = process.env.STAMPS_PASSWORD;

  if (!integrationId || !username || !password) {
    throw new Error(
      "Stamps.com credentials not configured. Please set STAMPS_INTEGRATION_ID, STAMPS_USERNAME, and STAMPS_PASSWORD environment variables."
    );
  }

  return {
    integrationId,
    username,
    password,
  };
}
