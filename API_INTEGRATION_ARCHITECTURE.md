# API Integration Architecture
## Carrier Dispute System - Third-Party Service Integration Guide

This document outlines the comprehensive integration architecture for all third-party services, ensuring maximum flexibility, scalability, and no restrictions.

---

## Table of Contents
1. [ShipStation API Integration](#shipstation-api-integration)
2. [WooCommerce API Integration](#woocommerce-api-integration)
3. [Zoho Desk API Integration](#zoho-desk-api-integration)
4. [OpenAI API Integration](#openai-api-integration)
5. [Google Services Integration](#google-services-integration)
6. [Gmail API Integration](#gmail-api-integration)
7. [Google Calendar Integration](#google-calendar-integration)
8. [Architecture Principles](#architecture-principles)
9. [Rate Limiting & Error Handling](#rate-limiting--error-handling)
10. [Security & Credentials Management](#security--credentials-management)

---

## ShipStation API Integration

### API Versions
- **V1 API**: Legacy endpoints for basic operations
- **V2 API**: Modern endpoints with batch operations, manifests, return labels
- **Recommendation**: Use V2 for new features, maintain V1 compatibility

### Core Capabilities

#### Orders Management
- **List Orders**: `GET /orders` - Retrieve orders with filtering
  - Filters: orderStatus, orderDateStart, orderDateEnd, modifyDateStart, modifyDateEnd
  - Pagination: page, pageSize (max 500)
- **Get Order**: `GET /orders/{orderId}` - Retrieve single order details
- **Create/Update Order**: `POST /orders/createorder`, `POST /orders/createorders` (batch)
- **Delete Order**: `DELETE /orders/{orderId}`
- **Mark as Shipped**: `POST /orders/markasshipped`
- **Hold/Restore**: `POST /orders/holduntil`, `POST /orders/restorefromhold`

#### Shipments & Labels
- **Create Label**: `POST /shipments/createlabel`
- **Get Rates**: `POST /shipments/getrates` - Compare carrier rates
- **Void Label**: `DELETE /shipments/{shipmentId}`
- **List Shipments**: `GET /shipments`

#### Carriers & Services
- **List Carriers**: `GET /carriers` - All available carriers
- **List Services**: `GET /carriers/listservices?carrierCode={code}`
- **List Packages**: `GET /carriers/listpackages?carrierCode={code}`
- **Get Carrier Info**: `GET /carriers/getcarrier?carrierCode={code}`

#### Products
- **List Products**: `GET /products`
- **Get Product**: `GET /products/{productId}`
- **Update Product**: `PUT /products/{productId}`

#### Stores & Channels
- **List Stores**: `GET /stores` - All connected selling channels
- **List Marketplaces**: `GET /stores/marketplaces`
- **Refresh Store**: `POST /stores/refreshstore`
- **Get Store**: `GET /stores/{storeId}`

#### Webhooks
- **Subscribe**: `POST /webhooks/subscribe`
- **List Webhooks**: `GET /webhooks`
- **Unsubscribe**: `DELETE /webhooks/{webhookId}`

**Available Webhook Events:**
- `ORDER_NOTIFY` - New order created
- `ITEM_ORDER_NOTIFY` - Order item updated
- `SHIP_NOTIFY` - Order shipped
- `ITEM_SHIP_NOTIFY` - Shipment item updated
- `CARRIER_UPDATE` - Carrier service changes

### Authentication
- **Method**: HTTP Basic Auth
- **Credentials**: API Key (username) + API Secret (password)
- **Header**: `Authorization: Basic base64(apiKey:apiSecret)`

### Rate Limits
- **V1**: 40 requests per 10 seconds per API key
- **V2**: Higher limits, specific to plan tier
- **Strategy**: Implement exponential backoff, queue system

### Data Sync Strategy
1. **Initial Sync**: Pull all orders from last 90 days
2. **Incremental Sync**: Use `modifyDateStart` to get updates
3. **Webhook Integration**: Real-time updates for new orders/shipments
4. **Reconciliation**: Daily full sync to catch missed webhooks

### Implementation Notes
- Store ShipStation account credentials in `shipstationAccounts` table
- Support multiple accounts with account switching
- Track sync status per account
- Log all API calls for audit trail
- Implement retry logic with exponential backoff
- Cache carrier/service lists (refresh daily)

---

## WooCommerce API Integration

### API Version
- **Current**: REST API v3
- **Endpoint Base**: `https://yourstore.com/wp-json/wc/v3/`

### Core Capabilities

#### Orders
- **List Orders**: `GET /orders`
  - Filters: status, customer, product, date_created, date_modified
  - Pagination: page, per_page (max 100)
- **Get Order**: `GET /orders/{id}`
- **Create Order**: `POST /orders`
- **Update Order**: `PUT /orders/{id}`
- **Delete Order**: `DELETE /orders/{id}`
- **Batch Operations**: `POST /orders/batch` - Create/update/delete multiple

#### Products
- **List Products**: `GET /products`
- **Get Product**: `GET /products/{id}`
- **Create Product**: `POST /products`
- **Update Product**: `PUT /products/{id}`
- **Batch Operations**: `POST /products/batch`

#### Customers
- **List Customers**: `GET /customers`
- **Get Customer**: `GET /customers/{id}`
- **Create Customer**: `POST /customers`

#### Product Variations
- **List Variations**: `GET /products/{product_id}/variations`
- **Get Variation**: `GET /products/{product_id}/variations/{id}`

#### Webhooks
- **Create Webhook**: `POST /webhooks`
- **List Webhooks**: `GET /webhooks`
- **Delete Webhook**: `DELETE /webhooks/{id}`

**Available Webhook Topics:**
- `order.created`, `order.updated`, `order.deleted`
- `product.created`, `product.updated`, `product.deleted`
- `customer.created`, `customer.updated`, `customer.deleted`

### Authentication
- **Method**: OAuth 1.0a or Consumer Key/Secret
- **Headers**: 
  - `Authorization: Basic base64(consumer_key:consumer_secret)` (HTTPS)
  - Or query params: `?consumer_key=xxx&consumer_secret=xxx` (HTTP)

### Rate Limits
- No official rate limits
- Recommended: Max 10 requests per second per store
- Implement throttling to avoid server overload

### Data Sync Strategy
1. **Product Sync**: Pull all products, map SKUs to master catalog
2. **Order Sync**: Pull orders by date range, link to shipments
3. **Webhook Integration**: Real-time order updates
4. **Inventory Sync**: Bi-directional inventory updates

### Implementation Notes
- Store per-channel credentials in `channels` table
- Support multiple WooCommerce stores
- Map WooCommerce SKUs to internal product catalog
- Handle product variations properly
- Implement webhook signature verification
- Cache product data to reduce API calls

---

## Zoho Desk API Integration

### API Version
- **Current**: v1
- **Endpoint Base**: `https://desk.zoho.com/api/v1/`

### Core Capabilities

#### Tickets
- **List Tickets**: `GET /tickets`
  - Filters: status, departmentId, assigneeId, channel, from, to
  - Pagination: limit (max 100), from
- **Get Ticket**: `GET /tickets/{ticketId}`
- **Create Ticket**: `POST /tickets`
  - Required: subject, departmentId, contactId, email
  - Optional: description, priority, status, assigneeId, category
- **Update Ticket**: `PATCH /tickets/{ticketId}`
- **Delete Ticket**: `DELETE /tickets/{ticketId}`
- **Add Comment**: `POST /tickets/{ticketId}/comments`
- **Add Attachment**: `POST /tickets/{ticketId}/attachments`

#### Contacts
- **List Contacts**: `GET /contacts`
- **Get Contact**: `GET /contacts/{contactId}`
- **Create Contact**: `POST /contacts`
- **Search Contact**: `GET /contacts/search?email={email}`

#### Departments
- **List Departments**: `GET /departments`
- **Get Department**: `GET /departments/{departmentId}`

#### Attachments
- **Upload Attachment**: `POST /attachments`
- **Download Attachment**: `GET /attachments/{attachmentId}`

### Authentication
- **Method**: OAuth 2.0 or API Token
- **Header**: `Authorization: Zoho-oauthtoken {access_token}`
- **Scopes**: `Desk.tickets.ALL`, `Desk.contacts.ALL`, `Desk.basic.ALL`

### Rate Limits
- **Free**: 25,000 requests/day/organization
- **Standard**: 50,000 requests/day/organization
- **Professional**: 100,000 requests/day/organization
- **Enterprise**: 200,000 requests/day/organization
- **Per Minute**: Soft limit to ensure availability

### Automatic Ticket Creation Workflow
1. **Case Created** → Check if contact exists
2. **Create Contact** (if needed) → Get contactId
3. **Create Ticket** with case details:
   - Subject: "Carrier Dispute - {Tracking Number}"
   - Description: Case summary with all details
   - Department: Configured department ID
   - Priority: Based on case priority
   - Custom Fields: Case ID, Carrier, Amount
4. **Add Attachments** → Upload evidence files
5. **Store Ticket ID** → Link to case record
6. **Sync Updates** → Bi-directional status sync

### Implementation Notes
- Store Zoho credentials in Settings (encrypted)
- Implement OAuth flow for user authorization
- Create contact automatically if doesn't exist
- Map case statuses to ticket statuses
- Sync ticket updates back to case
- Attach all case evidence to ticket
- Include case URL in ticket description

---

## OpenAI API Integration

### API Capabilities

#### Chat Completions
- **Endpoint**: `POST /v1/chat/completions`
- **Models**: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo
- **Features**: Streaming, function calling, vision, JSON mode

#### Assistants API (Agent Mode)
- **Create Assistant**: `POST /v1/assistants`
- **Create Thread**: `POST /v1/threads`
- **Add Message**: `POST /v1/threads/{thread_id}/messages`
- **Run Assistant**: `POST /v1/threads/{thread_id}/runs`
- **Tools**: Code Interpreter, File Search, Function Calling, **Browser (if available)**

#### Function Calling
- Define functions for AI to call:
  - `create_case(tracking_number, carrier, amount, ...)`
  - `search_cases(query, filters)`
  - `generate_document(case_id, template_id)`
  - `get_shipment_status(tracking_number)`
  - `analyze_image(image_url)`
  - `search_knowledge_base(query)`

#### Vision API
- **Capability**: Analyze images (screenshots, evidence photos)
- **Use Cases**:
  - Extract tracking numbers from screenshots
  - Read shipping labels
  - Analyze package damage photos
  - Extract data from carrier invoices

#### Embeddings
- **Model**: text-embedding-3-large
- **Use Case**: Knowledge base semantic search
- **Dimension**: 3072 (can be reduced)

### Authentication
- **Method**: Bearer Token
- **Header**: `Authorization: Bearer {api_key}`

### Rate Limits (Tier-based)
- **Tier 1**: 500 RPM, 200,000 TPM
- **Tier 2**: 5,000 RPM, 2,000,000 TPM
- **Tier 3**: 10,000 RPM, 4,000,000 TPM
- **Tier 4**: 30,000 RPM, 10,000,000 TPM
- **Tier 5**: 80,000 RPM, 30,000,000 TPM

### AI Agent Architecture

#### Long-Term Memory
- Store conversations in `aiConversations` table
- Retrieve relevant context using embeddings
- Maintain conversation threads per user
- Context window management (128k tokens for gpt-4o)

#### Agent Capabilities
1. **Conversational Assistant**
   - Answer questions about cases
   - Guide through dispute process
   - Explain carrier policies

2. **Autonomous Actions**
   - Create cases from voice/text input
   - Search for similar cases
   - Generate documents
   - Analyze images and extract data

3. **Web Browsing (if enabled)**
   - Research carrier terms of service
   - Check carrier websites for updates
   - Verify tracking information
   - Find precedent cases online

4. **Proactive Monitoring**
   - Detect patterns in cases
   - Alert to systematic issues
   - Suggest optimizations
   - Identify cost-saving opportunities

### Implementation Strategy
1. **Chat Interface**: Persistent chat widget on all pages
2. **Voice Input**: Integrate with browser Speech Recognition API
3. **Function Calling**: Define all system actions as functions
4. **Context Management**: Include relevant case/order data in prompts
5. **Streaming**: Real-time response streaming for better UX
6. **Error Handling**: Graceful degradation if API unavailable

---

## Google Services Integration

### Google Drive API

#### Capabilities
- **Create Folder**: `POST /drive/v3/files` (mimeType: application/vnd.google-apps.folder)
- **Upload File**: `POST /upload/drive/v3/files`
- **List Files**: `GET /drive/v3/files`
- **Share File/Folder**: `POST /drive/v3/files/{fileId}/permissions`
- **Get File**: `GET /drive/v3/files/{fileId}`

#### Folder Structure
```
Carrier Dispute Cases/
├── Case-001-UPS-12345/
│   ├── Dispute Letter.docx
│   ├── Evidence/
│   │   ├── Screenshot_001.png
│   │   ├── Invoice.pdf
│   │   └── Tracking_History.pdf
│   ├── Correspondence/
│   └── Generated_Reports/
├── Case-002-FedEx-67890/
└── ...
```

#### Authentication
- **Method**: OAuth 2.0
- **Scopes**: `https://www.googleapis.com/auth/drive.file`

### Google Docs API

#### Capabilities
- **Create Document**: `POST /v1/documents`
- **Get Document**: `GET /v1/documents/{documentId}`
- **Batch Update**: `POST /v1/documents/{documentId}:batchUpdate`
- **Insert Text**: Use batchUpdate with insertText request
- **Insert Image**: Use batchUpdate with insertInlineImage request
- **Export to PDF**: Use Drive API export

#### Document Generation Workflow
1. **Create from Template**: Copy template document
2. **Replace Placeholders**: Use batchUpdate to replace {{variables}}
3. **Append Evidence**: Insert images as appendixes
4. **Add Metadata**: Insert timestamps, case numbers
5. **Format**: Apply styles, page breaks
6. **Save to Drive**: Move to case folder
7. **Generate PDF**: Export for final submission

#### Authentication
- **Method**: OAuth 2.0
- **Scopes**: `https://www.googleapis.com/auth/documents`

### Google Sheets API

#### Capabilities
- **Read Data**: `GET /v4/spreadsheets/{spreadsheetId}/values/{range}`
- **Write Data**: `PUT /v4/spreadsheets/{spreadsheetId}/values/{range}`
- **Append Data**: `POST /v4/spreadsheets/{spreadsheetId}/values/{range}:append`
- **Batch Operations**: `POST /v4/spreadsheets/{spreadsheetId}/values:batchUpdate`

#### Shipment Data Sync
1. **Read Sheet**: Pull all rows from configured sheet
2. **Parse Data**: Extract tracking, order, product data
3. **Reconcile**: Match with existing shipment data
4. **Flag Conflicts**: Detect discrepancies
5. **Update Database**: Store with source attribution

#### Authentication
- **Method**: OAuth 2.0
- **Scopes**: `https://www.googleapis.com/auth/spreadsheets`

---

## Gmail API Integration

### Capabilities via MCP Server
- **List Messages**: Search and retrieve emails
- **Send Email**: Send dispute letters, notifications
- **Read Message**: Get email content
- **Create Draft**: Prepare emails for review
- **Add Label**: Organize case-related emails

### Use Cases
1. **Send Dispute Letters**: Email generated documents to carriers
2. **Track Correspondence**: Link emails to cases
3. **Automated Notifications**: Alert on case updates
4. **Email Parsing**: Extract tracking numbers from shipping notifications

### Authentication
- **Method**: OAuth 2.0 (via MCP server)
- **Scopes**: Managed by MCP configuration

---

## Google Calendar Integration

### Capabilities via MCP Server
- **Create Event**: Schedule follow-ups, deadlines
- **List Events**: View upcoming case deadlines
- **Update Event**: Modify scheduled actions
- **Delete Event**: Remove completed tasks

### Use Cases
1. **Deadline Tracking**: 30-day filing deadlines
2. **Follow-up Reminders**: Schedule carrier follow-ups
3. **Certification Expiry**: Alert on certification renewals
4. **Team Coordination**: Share case timelines

### Authentication
- **Method**: OAuth 2.0 (via MCP server)
- **Scopes**: Managed by MCP configuration

---

## Architecture Principles

### 1. Abstraction Layer
Create service abstraction for each integration:
```typescript
interface IShippingProvider {
  listOrders(filters: OrderFilters): Promise<Order[]>;
  getOrder(id: string): Promise<Order>;
  createLabel(shipment: Shipment): Promise<Label>;
  getRate(shipment: Shipment): Promise<Rate[]>;
}

class ShipStationService implements IShippingProvider { ... }
class CustomShippingService implements IShippingProvider { ... }
```

### 2. Multi-Source Data Reconciliation
```typescript
interface DataSource {
  id: number;
  name: string;
  type: 'SHIPSTATION' | 'GOOGLE_SHEETS' | 'WOOCOMMERCE' | 'MANUAL';
  reliability: number; // 0-100
}

interface ReconciliationResult {
  primaryData: any;
  confirmingSources: DataSource[];
  conflicts: Conflict[];
  confidence: number;
}
```

### 3. Event-Driven Architecture
- Use webhooks for real-time updates
- Implement event queue for processing
- Decouple services with message bus
- Enable async processing for heavy operations

### 4. Caching Strategy
- Cache carrier/service lists (24 hours)
- Cache product data (1 hour)
- Cache API responses (configurable per endpoint)
- Implement cache invalidation on webhooks

### 5. Retry & Circuit Breaker
```typescript
const retryConfig = {
  maxRetries: 3,
  backoff: 'exponential',
  initialDelay: 1000,
  maxDelay: 30000
};

const circuitBreaker = {
  failureThreshold: 5,
  resetTimeout: 60000,
  monitorInterval: 10000
};
```

---

## Rate Limiting & Error Handling

### Rate Limit Management
```typescript
class RateLimiter {
  private tokens: Map<string, TokenBucket>;
  
  async acquire(service: string, cost: number = 1): Promise<void> {
    // Token bucket algorithm
    // Wait if insufficient tokens
    // Track usage per service
  }
}
```

### Error Handling Strategy
1. **Transient Errors** (429, 503): Retry with backoff
2. **Auth Errors** (401, 403): Refresh token, notify admin
3. **Client Errors** (400, 404): Log and alert, don't retry
4. **Server Errors** (500, 502): Retry limited times
5. **Network Errors**: Retry with exponential backoff

### Monitoring & Logging
- Log all API requests/responses
- Track success/failure rates
- Monitor rate limit usage
- Alert on repeated failures
- Dashboard for API health

---

## Security & Credentials Management

### Credential Storage
- **Database**: Encrypted API keys/secrets in `shipstationAccounts`, `channels` tables
- **Environment Variables**: System-level credentials
- **OAuth Tokens**: Secure token storage with refresh logic

### Encryption
- Encrypt all API credentials at rest
- Use AES-256 encryption
- Secure key management
- Rotate encryption keys periodically

### Access Control
- Role-based access to integrations
- Audit log for credential access
- Separate credentials per environment
- Principle of least privilege

### Webhook Security
- Verify webhook signatures
- Use HTTPS only
- Implement replay protection
- Rate limit webhook endpoints

---

## Implementation Checklist

### Phase 1: Core Integrations
- [ ] ShipStation API client with V1 & V2 support
- [ ] WooCommerce API client
- [ ] Zoho Desk API client
- [ ] OpenAI API client with function calling
- [ ] Google Drive API client
- [ ] Google Docs API client
- [ ] Google Sheets API client

### Phase 2: Data Sync
- [ ] ShipStation order sync (initial + incremental)
- [ ] WooCommerce order sync
- [ ] Google Sheets shipment data sync
- [ ] Multi-source reconciliation engine
- [ ] Conflict detection and resolution

### Phase 3: Automation
- [ ] Webhook handlers for all services
- [ ] Automatic Zoho ticket creation
- [ ] Document generation with Google Docs
- [ ] AI agent with function calling
- [ ] Proactive monitoring and alerts

### Phase 4: Advanced Features
- [ ] OpenAI agent with browser access
- [ ] Voice input and transcription
- [ ] Image analysis and data extraction
- [ ] Knowledge base with embeddings
- [ ] Predictive analytics

---

## API Endpoint Summary

| Service | Base URL | Auth Method | Rate Limit |
|---------|----------|-------------|------------|
| ShipStation V1 | https://ssapi.shipstation.com | Basic Auth | 40/10s |
| ShipStation V2 | https://api.shipstation.com | API Key | Plan-based |
| WooCommerce | {store}/wp-json/wc/v3 | OAuth/Consumer Key | ~10/s |
| Zoho Desk | https://desk.zoho.com/api/v1 | OAuth 2.0 | Plan-based |
| OpenAI | https://api.openai.com/v1 | Bearer Token | Tier-based |
| Google Drive | https://www.googleapis.com/drive/v3 | OAuth 2.0 | 1000/100s |
| Google Docs | https://docs.googleapis.com/v1 | OAuth 2.0 | 300/60s |
| Google Sheets | https://sheets.googleapis.com/v4 | OAuth 2.0 | 100/100s |
| Gmail | https://gmail.googleapis.com/gmail/v1 | OAuth 2.0 (MCP) | 250/s |

---

## Conclusion

This architecture provides:
- **Maximum Flexibility**: Support for multiple providers and data sources
- **Scalability**: Designed to handle growth in volume and complexity
- **No Restrictions**: All documented API capabilities are accessible
- **Reliability**: Robust error handling and retry logic
- **Security**: Encrypted credentials and secure authentication
- **Maintainability**: Clean abstractions and comprehensive documentation

All API integrations are designed to work seamlessly together, with proper data reconciliation, conflict resolution, and a unified interface for the application.
