# API Documentation - Carrier Dispute System

Complete API reference for the Carrier Dispute System.

## Base URL

```
https://your-domain.com/api
```

## Authentication

All API requests require JWT authentication.

**Header:**
```
Authorization: Bearer <jwt_token>
```

**Getting a Token:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}

# Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

## tRPC Endpoints

The system uses tRPC for type-safe API communication. All endpoints are accessed via the tRPC client.

### Cases

#### List All Cases

**Endpoint:** `cases.getAll`

**Input:**
```typescript
{
  status?: string[];           // Filter by status
  caseType?: string[];         // Filter by case type
  carrier?: string;            // Filter by carrier
  priority?: string;           // Filter by priority
  search?: string;             // Search term
  page?: number;               // Page number (default: 1)
  limit?: number;              // Items per page (default: 25)
}
```

**Output:**
```typescript
{
  cases: Case[];
  total: number;
  page: number;
  totalPages: number;
}
```

**Example:**
```typescript
const result = await trpc.cases.getAll.query({
  status: ['DRAFT', 'FILED'],
  caseType: ['DAMAGE'],
  page: 1,
  limit: 50
});
```

#### Get Case by ID

**Endpoint:** `cases.getById`

**Input:**
```typescript
{
  id: number;
}
```

**Output:**
```typescript
Case
```

**Example:**
```typescript
const case = await trpc.cases.getById.query({ id: 123 });
```

#### Create Case

**Endpoint:** `cases.create`

**Input:**
```typescript
{
  caseNumber?: string;         // Auto-generated if not provided
  status: string;              // DRAFT, FILED, etc.
  priority: string;            // LOW, MEDIUM, HIGH, URGENT
  caseType: string;            // DAMAGE, ADJUSTMENT, SLA
  carrier: string;             // FEDEX, UPS, USPS, DHL, OTHER
  trackingId?: string;
  orderNumber?: string;
  recipientName?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  claimedAmount?: number;
  // ... other fields
}
```

**Output:**
```typescript
Case
```

**Example:**
```typescript
const newCase = await trpc.cases.create.mutate({
  status: 'DRAFT',
  priority: 'MEDIUM',
  caseType: 'DAMAGE',
  carrier: 'FEDEX',
  trackingId: '123456789',
  recipientEmail: 'customer@example.com',
  claimedAmount: 50.00
});
```

#### Update Case

**Endpoint:** `cases.update`

**Input:**
```typescript
{
  id: number;
  updates: Partial<Case>;
}
```

**Output:**
```typescript
Case
```

**Example:**
```typescript
const updated = await trpc.cases.update.mutate({
  id: 123,
  updates: {
    status: 'FILED',
    claimedAmount: 75.00
  }
});
```

#### Delete Case

**Endpoint:** `cases.delete`

**Input:**
```typescript
{
  id: number;
}
```

**Output:**
```typescript
{
  success: boolean;
}
```

**Example:**
```typescript
await trpc.cases.delete.mutate({ id: 123 });
```

#### Bulk Update Cases

**Endpoint:** `cases.bulkUpdate`

**Input:**
```typescript
{
  ids: number[];
  updates: Partial<Case>;
}
```

**Output:**
```typescript
{
  updated: number;
  failed: number;
  errors?: string[];
}
```

**Example:**
```typescript
const result = await trpc.cases.bulkUpdate.mutate({
  ids: [123, 124, 125],
  updates: {
    status: 'FILED',
    priority: 'HIGH'
  }
});
```

### Documents

#### Generate Dispute Letter

**Endpoint:** `documents.generateDisputeLetter`

**Input:**
```typescript
{
  caseId: number;
  tone: 'PROFESSIONAL' | 'FIRM' | 'ESCALATED';
}
```

**Output:**
```typescript
{
  content: string;
  wordCount: number;
  characterCount: number;
}
```

**Example:**
```typescript
const letter = await trpc.documents.generateDisputeLetter.mutate({
  caseId: 123,
  tone: 'PROFESSIONAL'
});
```

#### Generate Word Document

**Endpoint:** `documents.generateDisputeLetterWord`

**Input:**
```typescript
{
  caseId: number;
  tone: 'PROFESSIONAL' | 'FIRM' | 'ESCALATED';
}
```

**Output:**
```typescript
{
  buffer: Buffer;
  filename: string;
}
```

**Example:**
```typescript
const doc = await trpc.documents.generateDisputeLetterWord.mutate({
  caseId: 123,
  tone: 'FIRM'
});

// Download file
const blob = new Blob([doc.buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = doc.filename;
a.click();
```

#### Build Evidence Package

**Endpoint:** `documents.buildEvidencePackage`

**Input:**
```typescript
{
  caseId: number;
}
```

**Output:**
```typescript
{
  buffer: Buffer;
  filename: string;
}
```

**Example:**
```typescript
const package = await trpc.documents.buildEvidencePackage.mutate({
  caseId: 123
});
```

#### Compile Evidence PDF

**Endpoint:** `documents.compileEvidencePDF`

**Input:**
```typescript
{
  caseId: number;
}
```

**Output:**
```typescript
{
  buffer: Buffer;
  filename: string;
}
```

**Example:**
```typescript
const pdf = await trpc.documents.compileEvidencePDF.mutate({
  caseId: 123
});
```

#### Send Bulk Email

**Endpoint:** `documents.sendBulkEmail`

**Input:**
```typescript
{
  caseIds: number[];
  subject: string;
  body: string;
  template?: string;
}
```

**Output:**
```typescript
{
  sent: number;
  failed: number;
  errors: string[];
}
```

**Example:**
```typescript
const result = await trpc.documents.sendBulkEmail.mutate({
  caseIds: [123, 124, 125],
  subject: 'Case Status Update',
  body: 'Your case {{caseNumber}} has been updated to {{status}}.',
  template: 'status_update'
});
```

#### Generate Weekly Report

**Endpoint:** `documents.generateWeeklyReport`

**Input:**
```typescript
{
  startDate: Date;
  endDate: Date;
  format: 'HTML' | 'PDF';
}
```

**Output:**
```typescript
{
  content: string | Buffer;
  filename?: string;
}
```

**Example:**
```typescript
const report = await trpc.documents.generateWeeklyReport.mutate({
  startDate: new Date('2025-10-01'),
  endDate: new Date('2025-10-31'),
  format: 'PDF'
});
```

### Webhooks

#### Typeform Webhook

**Endpoint:** `POST /api/webhooks/typeform`

**Headers:**
```
Content-Type: application/json
X-Typeform-Signature: <signature>
```

**Body:**
```json
{
  "event_id": "01G...",
  "event_type": "form_response",
  "form_response": {
    "form_id": "abc123",
    "token": "xyz789",
    "submitted_at": "2025-10-30T12:00:00Z",
    "answers": [
      {
        "field": {
          "id": "email",
          "type": "email"
        },
        "email": "customer@example.com"
      },
      {
        "field": {
          "id": "order_number",
          "type": "short_text"
        },
        "text": "ORD-12345"
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "caseId": 123,
  "caseNumber": "CASE-05088"
}
```

#### Google Sheets Webhook

**Endpoint:** `POST /api/webhooks/google-sheets`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <api_key>
```

**Body:**
```json
{
  "spreadsheetId": "1abc...",
  "sheetName": "Form Responses 1",
  "row": {
    "Timestamp": "2025-10-30 12:00:00",
    "Email": "customer@example.com",
    "Name": "John Doe",
    "Order Number": "ORD-12345",
    "Tracking Number": "123456789",
    "Damage Type": "Tube, Rod",
    "Damage Description": "Bent fishing rod"
  }
}
```

**Response:**
```json
{
  "success": true,
  "caseId": 123,
  "caseNumber": "CASE-05088"
}
```

#### Generic Webhook

**Endpoint:** `POST /api/webhooks/incoming`

**Headers:**
```
Content-Type: application/json
X-Webhook-Signature: <signature>
```

**Body:**
```json
{
  "event": "case.created",
  "data": {
    "caseId": 123,
    "caseNumber": "CASE-05088",
    "status": "DRAFT"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed"
}
```

### Reminders

#### Create Reminder

**Endpoint:** `reminders.create`

**Input:**
```typescript
{
  caseId: number;
  date: Date;
  note: string;
  recurring?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}
```

**Output:**
```typescript
{
  id: number;
  caseId: number;
  date: Date;
  note: string;
  recurring?: string;
  completed: boolean;
}
```

**Example:**
```typescript
const reminder = await trpc.reminders.create.mutate({
  caseId: 123,
  date: new Date('2025-11-01'),
  note: 'Follow up with carrier',
  recurring: 'WEEKLY'
});
```

#### Get Upcoming Reminders

**Endpoint:** `reminders.getUpcoming`

**Input:**
```typescript
{
  days?: number;  // Default: 7
}
```

**Output:**
```typescript
Reminder[]
```

**Example:**
```typescript
const reminders = await trpc.reminders.getUpcoming.query({
  days: 14
});
```

#### Mark Reminder Complete

**Endpoint:** `reminders.markComplete`

**Input:**
```typescript
{
  id: number;
}
```

**Output:**
```typescript
{
  success: boolean;
}
```

**Example:**
```typescript
await trpc.reminders.markComplete.mutate({ id: 456 });
```

### Insurance Claims

#### File Insurance Claim

**Endpoint:** `insuranceClaims.file`

**Input:**
```typescript
{
  caseId: number;
  provider: string;
  policyNumber: string;
  coverage: number;
  notes?: string;
}
```

**Output:**
```typescript
{
  claimNumber: string;
  status: string;
  filedAt: Date;
}
```

**Example:**
```typescript
const claim = await trpc.insuranceClaims.file.mutate({
  caseId: 123,
  provider: 'Acme Insurance',
  policyNumber: 'POL-12345',
  coverage: 1000.00,
  notes: 'Damage to fishing rod'
});
```

#### File Carrier Guarantee Claim

**Endpoint:** `insuranceClaims.fileCarrierGuarantee`

**Input:**
```typescript
{
  caseId: number;
  notes?: string;
}
```

**Output:**
```typescript
{
  claimNumber: string;
  eligible: boolean;
  reason?: string;
  filedAt: Date;
}
```

**Example:**
```typescript
const claim = await trpc.insuranceClaims.fileCarrierGuarantee.mutate({
  caseId: 123,
  notes: 'Late delivery'
});
```

#### Check Eligibility

**Endpoint:** `insuranceClaims.checkEligibility`

**Input:**
```typescript
{
  caseId: number;
  claimType: 'INSURANCE' | 'CARRIER_GUARANTEE';
}
```

**Output:**
```typescript
{
  eligible: boolean;
  reason?: string;
  recommendations: string[];
}
```

**Example:**
```typescript
const eligibility = await trpc.insuranceClaims.checkEligibility.query({
  caseId: 123,
  claimType: 'CARRIER_GUARANTEE'
});
```

### Purchase Verification

#### Verify Purchase

**Endpoint:** `purchaseVerification.verify`

**Input:**
```typescript
{
  orderNumber: string;
  email: string;
}
```

**Output:**
```typescript
{
  verified: boolean;
  purchaseDate?: Date;
  warrantyEligible: boolean;
  warrantyExpiration?: Date;
  source: string;
  notes?: string;
}
```

**Example:**
```typescript
const verification = await trpc.purchaseVerification.verify.mutate({
  orderNumber: 'ORD-12345',
  email: 'customer@example.com'
});
```

#### Request Receipt

**Endpoint:** `purchaseVerification.requestReceipt`

**Input:**
```typescript
{
  caseId: number;
}
```

**Output:**
```typescript
{
  emailSent: boolean;
  message: string;
}
```

**Example:**
```typescript
const result = await trpc.purchaseVerification.requestReceipt.mutate({
  caseId: 123
});
```

## REST Endpoints

Some endpoints use traditional REST for file uploads and webhooks.

### File Upload

**Endpoint:** `POST /api/upload`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Body:**
```
file: <file>
caseId: <number>
type: <string>  // e.g., 'damage_photo', 'receipt', 'invoice'
```

**Response:**
```json
{
  "success": true,
  "url": "https://storage.example.com/files/abc123.jpg",
  "filename": "damage_photo_1.jpg"
}
```

**Example (JavaScript):**
```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('caseId', '123');
formData.append('type', 'damage_photo');

const response = await fetch('/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
```

## Error Handling

All API errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional error details
    }
  }
}
```

### Common Error Codes

- `UNAUTHORIZED` - Missing or invalid authentication token
- `FORBIDDEN` - User lacks permission for this action
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Input validation failed
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Rate Limiting

API requests are rate limited to prevent abuse.

**Limits:**
- 100 requests per minute per user
- 1000 requests per hour per user

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1698765432
```

**Rate Limit Exceeded Response:**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  }
}
```

## Webhooks

### Outgoing Webhooks

The system can send webhooks to external URLs when events occur.

**Supported Events:**
- `case.created` - New case created
- `case.updated` - Case updated
- `case.resolved` - Case resolved
- `status.changed` - Case status changed

**Webhook Payload:**
```json
{
  "event": "case.created",
  "timestamp": "2025-10-30T12:00:00Z",
  "data": {
    "caseId": 123,
    "caseNumber": "CASE-05088",
    "status": "DRAFT",
    "carrier": "FEDEX",
    "trackingId": "123456789",
    "claimedAmount": 50.00
  }
}
```

**Webhook Signature:**

Webhooks include an HMAC signature for verification.

**Header:**
```
X-Webhook-Signature: sha256=abc123...
```

**Verification (Node.js):**
```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const expectedSignature = `sha256=${hmac.digest('hex')}`;
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './server/routers';

const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'https://your-domain.com/api/trpc',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
  ],
});

// List cases
const cases = await client.cases.getAll.query({
  status: ['DRAFT', 'FILED'],
  page: 1,
  limit: 50,
});

// Create case
const newCase = await client.cases.create.mutate({
  status: 'DRAFT',
  caseType: 'DAMAGE',
  carrier: 'FEDEX',
  trackingId: '123456789',
  recipientEmail: 'customer@example.com',
  claimedAmount: 50.00,
});

// Generate letter
const letter = await client.documents.generateDisputeLetter.mutate({
  caseId: newCase.id,
  tone: 'PROFESSIONAL',
});
```

### Python

```python
import requests

BASE_URL = 'https://your-domain.com/api'
TOKEN = 'your_jwt_token'

headers = {
    'Authorization': f'Bearer {TOKEN}',
    'Content-Type': 'application/json'
}

# List cases
response = requests.post(
    f'{BASE_URL}/trpc/cases.getAll',
    headers=headers,
    json={
        'status': ['DRAFT', 'FILED'],
        'page': 1,
        'limit': 50
    }
)
cases = response.json()

# Create case
response = requests.post(
    f'{BASE_URL}/trpc/cases.create',
    headers=headers,
    json={
        'status': 'DRAFT',
        'caseType': 'DAMAGE',
        'carrier': 'FEDEX',
        'trackingId': '123456789',
        'recipientEmail': 'customer@example.com',
        'claimedAmount': 50.00
    }
)
new_case = response.json()
```

### cURL

```bash
# List cases
curl -X POST https://your-domain.com/api/trpc/cases.getAll \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": ["DRAFT", "FILED"],
    "page": 1,
    "limit": 50
  }'

# Create case
curl -X POST https://your-domain.com/api/trpc/cases.create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "DRAFT",
    "caseType": "DAMAGE",
    "carrier": "FEDEX",
    "trackingId": "123456789",
    "recipientEmail": "customer@example.com",
    "claimedAmount": 50.00
  }'

# Generate letter
curl -X POST https://your-domain.com/api/trpc/documents.generateDisputeLetter \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": 123,
    "tone": "PROFESSIONAL"
  }'
```

## Pagination

All list endpoints support pagination.

**Parameters:**
- `page` - Page number (1-indexed)
- `limit` - Items per page (default: 25, max: 500)

**Response:**
```json
{
  "items": [...],
  "total": 1234,
  "page": 1,
  "totalPages": 50,
  "hasMore": true
}
```

## Filtering

List endpoints support filtering by multiple criteria.

**Example:**
```typescript
const cases = await trpc.cases.getAll.query({
  status: ['DRAFT', 'FILED'],           // Multiple statuses
  caseType: ['DAMAGE'],                 // Single case type
  carrier: 'FEDEX',                     // Single carrier
  priority: 'HIGH',                     // Single priority
  search: 'tracking:123456789',         // Search query
  page: 1,
  limit: 50
});
```

## Sorting

List endpoints support sorting.

**Parameters:**
- `sortBy` - Field to sort by
- `sortOrder` - `asc` or `desc`

**Example:**
```typescript
const cases = await trpc.cases.getAll.query({
  sortBy: 'claimedAmount',
  sortOrder: 'desc',
  page: 1,
  limit: 50
});
```

## Best Practices

1. **Use tRPC client** - Type-safe, auto-complete, runtime validation
2. **Handle errors** - Always wrap API calls in try-catch
3. **Implement retry logic** - For transient failures
4. **Cache responses** - Reduce API calls
5. **Respect rate limits** - Implement backoff
6. **Validate inputs** - Before sending to API
7. **Use pagination** - For large datasets
8. **Secure tokens** - Never expose JWT in client-side code
9. **Monitor usage** - Track API calls and errors
10. **Keep documentation updated** - As API evolves

## Support

For API support:
- Email: herve@catchthefever.com
- Documentation: See README.md, WIKI.md, DEVELOPER.md

---

**Last Updated:** October 30, 2025  
**API Version:** 1.0.0  
**Maintained by:** Catch The Fever Development Team
