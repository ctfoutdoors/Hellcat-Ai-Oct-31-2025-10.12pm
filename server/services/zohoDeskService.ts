/**
 * Zoho Desk Service
 * Integration with Zoho Desk for ticket management
 */

import { getServiceCredentials } from './apiService';

interface ZohoDeskConfig {
  orgId: string;
  accessToken: string; // OAuth access token
  region: string; // 'com', 'eu', 'in', 'com.au', 'jp'
}

interface ZohoDeskTicket {
  subject: string;
  departmentId: string;
  contactId?: string;
  email?: string;
  phone?: string;
  description: string;
  status?: string;
  priority?: string;
  classification?: string;
  category?: string;
  subCategory?: string;
  customFields?: Record<string, any>;
}

interface ZohoDeskContact {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
}

/**
 * Get Zoho Desk API base URL
 */
function getZohoDeskUrl(region: string): string {
  const regionMap: Record<string, string> = {
    'com': 'https://desk.zoho.com',
    'eu': 'https://desk.zoho.eu',
    'in': 'https://desk.zoho.in',
    'com.au': 'https://desk.zoho.com.au',
    'jp': 'https://desk.zoho.jp',
  };
  return regionMap[region] || regionMap['com'];
}

/**
 * Make authenticated request to Zoho Desk API
 */
async function zohoDeskRequest(
  config: ZohoDeskConfig,
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const baseUrl = getZohoDeskUrl(config.region);
  const url = `${baseUrl}/api/v1${endpoint}`;

  const headers = {
    'Authorization': `Zoho-oauthtoken ${config.accessToken}`,
    'orgId': config.orgId,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoho Desk API error: ${response.status} - ${error}`);
  }

  return await response.json();
}

/**
 * Create or find contact in Zoho Desk
 */
export async function createOrFindZohoDeskContact(
  contact: ZohoDeskContact
): Promise<string> {
  const creds = await getServiceCredentials('ZOHO_DESK');
  const config: ZohoDeskConfig = {
    orgId: creds.org_id,
    accessToken: creds.access_token,
    region: creds.region || 'com',
  };
  
  // Search for existing contact by email
  try {
    const searchResult = await zohoDeskRequest(
      config,
      `/contacts/search?email=${encodeURIComponent(contact.email)}`
    );

    if (searchResult.data && searchResult.data.length > 0) {
      return searchResult.data[0].id;
    }
  } catch (error) {
    console.log('[Zoho Desk] Contact not found, creating new one');
  }

  // Create new contact
  const response = await zohoDeskRequest(
    config,
    '/contacts',
    {
      method: 'POST',
      body: JSON.stringify({
        firstName: contact.firstName,
        lastName: contact.lastName || '',
        email: contact.email,
        phone: contact.phone,
      }),
    }
  );

  return response.id;
}

/**
 * Create ticket in Zoho Desk
 */
export async function createZohoDeskTicket(
  ticket: ZohoDeskTicket
): Promise<{ ticketId: string; ticketNumber: string }> {
  const creds = await getServiceCredentials('ZOHO_DESK');
  const config: ZohoDeskConfig = {
    orgId: creds.org_id,
    accessToken: creds.access_token,
    region: creds.region || 'com',
  };

  const response = await zohoDeskRequest(
    config,
    '/tickets',
    {
      method: 'POST',
      body: JSON.stringify({
        subject: ticket.subject,
        departmentId: ticket.departmentId,
        contactId: ticket.contactId,
        email: ticket.email,
        phone: ticket.phone,
        description: ticket.description,
        status: ticket.status || 'Open',
        priority: ticket.priority || 'Medium',
        classification: ticket.classification,
        category: ticket.category,
        subCategory: ticket.subCategory,
        cf: ticket.customFields || {},
      }),
    }
  );

  return {
    ticketId: response.id,
    ticketNumber: response.ticketNumber,
  };
}

/**
 * Update ticket in Zoho Desk
 */
export async function updateZohoDeskTicket(
  ticketId: string,
  updates: Partial<ZohoDeskTicket>
): Promise<void> {
  const creds = await getServiceCredentials('ZOHO_DESK');
  const config: ZohoDeskConfig = {
    orgId: creds.org_id,
    accessToken: creds.access_token,
    region: creds.region || 'com',
  };

  await zohoDeskRequest(
    config,
    `/tickets/${ticketId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }
  );
}

/**
 * Get ticket from Zoho Desk
 */
export async function getZohoDeskTicket(ticketId: string): Promise<any> {
  const creds = await getServiceCredentials('ZOHO_DESK');
  const config: ZohoDeskConfig = {
    orgId: creds.org_id,
    accessToken: creds.access_token,
    region: creds.region || 'com',
  };

  return await zohoDeskRequest(config, `/tickets/${ticketId}`);
}

/**
 * Add attachment to Zoho Desk ticket
 */
export async function addZohoDeskAttachment(
  ticketId: string,
  fileUrl: string,
  fileName: string
): Promise<void> {
  const creds = await getServiceCredentials('ZOHO_DESK');
  const config: ZohoDeskConfig = {
    orgId: creds.org_id,
    accessToken: creds.access_token,
    region: creds.region || 'com',
  };

  // Download file from URL
  const fileResponse = await fetch(fileUrl);
  const fileBlob = await fileResponse.blob();

  // Create form data
  const formData = new FormData();
  formData.append('file', fileBlob, fileName);

  await zohoDeskRequest(
    config,
    `/tickets/${ticketId}/attachments`,
    {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type, let browser set it with boundary
      },
    }
  );
}

/**
 * Add comment to Zoho Desk ticket
 */
export async function addZohoDeskComment(
  ticketId: string,
  comment: string,
  isPublic: boolean = false
): Promise<void> {
  const creds = await getServiceCredentials('ZOHO_DESK');
  const config: ZohoDeskConfig = {
    orgId: creds.org_id,
    accessToken: creds.access_token,
    region: creds.region || 'com',
  };

  await zohoDeskRequest(
    config,
    `/tickets/${ticketId}/comments`,
    {
      method: 'POST',
      body: JSON.stringify({
        content: comment,
        isPublic,
      }),
    }
  );
}

/**
 * Get list of departments
 */
export async function getZohoDeskDepartments(): Promise<any[]> {
  const creds = await getServiceCredentials('ZOHO_DESK');
  const config: ZohoDeskConfig = {
    orgId: creds.org_id,
    accessToken: creds.access_token,
    region: creds.region || 'com',
  };

  const response = await zohoDeskRequest(config, '/departments');
  return response.data || [];
}

/**
 * Test Zoho Desk connection
 */
export async function testZohoDeskConnection(): Promise<boolean> {
  try {
    const creds = await getServiceCredentials('ZOHO_DESK');
    const config: ZohoDeskConfig = {
      orgId: creds.org_id,
      accessToken: creds.access_token,
      region: creds.region || 'com',
    };
    await zohoDeskRequest(config, '/departments');
    return true;
  } catch (error) {
    console.error('[Zoho Desk] Connection test failed:', error);
    return false;
  }
}

/**
 * Create Zoho Desk ticket from case data
 */
export async function createTicketFromCase(caseData: {
  caseNumber: string;
  trackingId: string;
  carrier: string;
  claimedAmount: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  attachments?: Array<{ url: string; fileName: string }>;
}): Promise<{ ticketId: string; ticketNumber: string }> {
  // Create or find contact
  let contactId: string | undefined;
  if (caseData.customerEmail) {
    const [firstName, ...lastNameParts] = (caseData.customerName || 'Customer').split(' ');
    contactId = await createOrFindZohoDeskContact({
      firstName,
      lastName: lastNameParts.join(' '),
      email: caseData.customerEmail,
      phone: caseData.customerPhone,
    });
  }

  // Get default department (first one)
  const departments = await getZohoDeskDepartments();
  const departmentId = departments[0]?.id;

  if (!departmentId) {
    throw new Error('No departments found in Zoho Desk');
  }

  // Create ticket
  const ticket = await createZohoDeskTicket({
    subject: `Carrier Dispute - ${caseData.caseNumber} - ${caseData.carrier} - $${caseData.claimedAmount}`,
    departmentId,
    contactId,
    email: caseData.customerEmail,
    phone: caseData.customerPhone,
    description: `
Carrier Dispute Case: ${caseData.caseNumber}
Tracking ID: ${caseData.trackingId}
Carrier: ${caseData.carrier}
Claimed Amount: $${caseData.claimedAmount}
Customer: ${caseData.customerName || 'N/A'}

${caseData.notes || 'No additional notes'}
    `.trim(),
    priority: caseData.claimedAmount > 100 ? 'High' : 'Medium',
    category: 'Carrier Dispute',
    customFields: {
      case_number: caseData.caseNumber,
      tracking_id: caseData.trackingId,
      carrier: caseData.carrier,
      claimed_amount: caseData.claimedAmount,
    },
  });

  // Add attachments if any
  if (caseData.attachments && caseData.attachments.length > 0) {
    for (const attachment of caseData.attachments) {
      try {
        await addZohoDeskAttachment(ticket.ticketId, attachment.url, attachment.fileName);
      } catch (error) {
        console.error('[Zoho Desk] Failed to add attachment:', error);
      }
    }
  }

  return ticket;
}
