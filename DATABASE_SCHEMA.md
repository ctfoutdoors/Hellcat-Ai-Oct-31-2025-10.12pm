# Hellcat Intelligence Platform - Database Schema Documentation

**Generated:** November 25, 2025  
**Database:** MySQL/TiDB  
**ORM:** Drizzle ORM  
**Schema Location:** `drizzle/schema.ts`

---

## Database Overview

The Hellcat Intelligence Platform uses a comprehensive relational database schema supporting multiple business modules including CRM, case management, inventory, orders, and AI-powered intelligence systems.

### Core Modules

1. **User Management** - Authentication and user profiles
2. **CRM System** - Customers, vendors, leads, contacts
3. **Case Management** - Carrier dispute tracking and resolution
4. **Product & Inventory** - Product catalog, variants, stock management
5. **Order Management** - Multi-channel order processing
6. **Email Integration** - Email tracking and activity logging
7. **AI Intelligence** - Document analysis, agent system, mission control
8. **Calendar & Tasks** - Meeting scheduling and task management

---

## Table Structure

### Authentication & Users

#### `users`
Primary user authentication and profile table.

**Columns:**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT) - Unique user identifier
- `openId` (VARCHAR(64), UNIQUE, NOT NULL) - Manus OAuth identifier
- `name` (TEXT) - User display name
- `email` (VARCHAR(320)) - Email address
- `loginMethod` (VARCHAR(64)) - Authentication method used
- `role` (ENUM: 'user', 'admin', DEFAULT 'user') - User role
- `createdAt` (TIMESTAMP, DEFAULT NOW) - Account creation timestamp
- `updatedAt` (TIMESTAMP, ON UPDATE NOW) - Last update timestamp
- `lastSignedIn` (TIMESTAMP, DEFAULT NOW) - Last login timestamp

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `openId`

---

### CRM Module

#### `customers`
Unified customer management supporting both individuals and companies.

**Columns:**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `type` (ENUM: 'individual', 'company') - Customer type
- `businessType` (ENUM: 'b2b', 'b2c', 'both', NULL) - Business classification
- `name` (VARCHAR(255), NOT NULL) - Customer name
- `email` (VARCHAR(320))
- `phone` (VARCHAR(50))
- `company` (VARCHAR(255)) - Company name for individuals
- `website` (VARCHAR(255))
- `billingAddress` (TEXT)
- `shippingAddress` (TEXT)
- `notes` (TEXT)
- `tags` (TEXT) - Comma-separated tags
- `woocommerceId` (INT, UNIQUE) - WooCommerce customer ID
- `createdAt` (TIMESTAMP, DEFAULT NOW)
- `updatedAt` (TIMESTAMP, ON UPDATE NOW)

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `woocommerceId`
- INDEX on `type`
- INDEX on `businessType`

#### `customer_contacts`
Related contacts for company customers.

**Columns:**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `customerId` (INT, NOT NULL, FOREIGN KEY → customers.id)
- `name` (VARCHAR(255), NOT NULL)
- `email` (VARCHAR(320))
- `phone` (VARCHAR(50))
- `position` (VARCHAR(100))
- `isPrimary` (BOOLEAN, DEFAULT FALSE)
- `createdAt` (TIMESTAMP, DEFAULT NOW)

**Relationships:**
- FOREIGN KEY `customerId` REFERENCES `customers(id)` ON DELETE CASCADE

#### `customer_activities`
Timeline of customer interactions and events.

**Columns:**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `customerId` (INT, NOT NULL, FOREIGN KEY → customers.id)
- `type` (ENUM: 'note', 'email', 'call', 'meeting', 'order', 'other')
- `description` (TEXT, NOT NULL)
- `createdBy` (INT, FOREIGN KEY → users.id)
- `createdAt` (TIMESTAMP, DEFAULT NOW)

**Relationships:**
- FOREIGN KEY `customerId` REFERENCES `customers(id)` ON DELETE CASCADE
- FOREIGN KEY `createdBy` REFERENCES `users(id)` ON DELETE SET NULL

#### `customer_shipments`
Shipment data for route visualization.

**Columns:**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `customerId` (INT, NOT NULL, FOREIGN KEY → customers.id)
- `trackingNumber` (VARCHAR(100))
- `carrier` (VARCHAR(50))
- `origin` (VARCHAR(255))
- `destination` (VARCHAR(255))
- `status` (VARCHAR(50))
- `shipDate` (TIMESTAMP)
- `deliveryDate` (TIMESTAMP)
- `createdAt` (TIMESTAMP, DEFAULT NOW)

**Relationships:**
- FOREIGN KEY `customerId` REFERENCES `customers(id)` ON DELETE CASCADE

#### `vendors`
Supplier and vendor management.

**Columns:**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `name` (VARCHAR(255), NOT NULL)
- `email` (VARCHAR(320))
- `phone` (VARCHAR(50))
- `website` (VARCHAR(255))
- `address` (TEXT)
- `notes` (TEXT)
- `tags` (TEXT)
- `createdAt` (TIMESTAMP, DEFAULT NOW)
- `updatedAt` (TIMESTAMP, ON UPDATE NOW)

#### `vendor_contacts`
Contact persons for vendors.

**Columns:**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `vendorId` (INT, NOT NULL, FOREIGN KEY → vendors.id)
- `name` (VARCHAR(255), NOT NULL)
- `email` (VARCHAR(320))
- `phone` (VARCHAR(50))
- `position` (VARCHAR(100))
- `isPrimary` (BOOLEAN, DEFAULT FALSE)
- `createdAt` (TIMESTAMP, DEFAULT NOW)

**Relationships:**
- FOREIGN KEY `vendorId` REFERENCES `vendors(id)` ON DELETE CASCADE

#### `leads`
Potential customer tracking with kanban workflow.

**Columns:**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `name` (VARCHAR(255), NOT NULL)
- `email` (VARCHAR(320))
- `phone` (VARCHAR(50))
- `company` (VARCHAR(255))
- `type` (ENUM: 'b2b', 'b2c', 'referral', 'inbound', 'outbound')
- `status` (ENUM: 'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', DEFAULT 'new')
- `value` (DECIMAL(10,2))
- `source` (VARCHAR(100))
- `notes` (TEXT)
- `createdAt` (TIMESTAMP, DEFAULT NOW)
- `updatedAt` (TIMESTAMP, ON UPDATE NOW)

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `status`
- INDEX on `type`

#### `lead_activities`
Lead interaction history.

**Columns:**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `leadId` (INT, NOT NULL, FOREIGN KEY → leads.id)
- `type` (ENUM: 'note', 'email', 'call', 'meeting', 'other')
- `description` (TEXT, NOT NULL)
- `createdBy` (INT, FOREIGN KEY → users.id)
- `createdAt` (TIMESTAMP, DEFAULT NOW)

**Relationships:**
- FOREIGN KEY `leadId` REFERENCES `leads(id)` ON DELETE CASCADE
- FOREIGN KEY `createdBy` REFERENCES `users(id)` ON DELETE SET NULL

---

### Case Management Module

#### `cases`
Carrier dispute case tracking.

**Columns:**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `caseNumber` (VARCHAR(50), UNIQUE, NOT NULL)
- `title` (VARCHAR(255), NOT NULL)
- `description` (TEXT)
- `caseType` (ENUM: 'adjustments', 'damages', 'sla', 'lost', 'billing', 'refund')
- `carrier` (ENUM: 'fedex', 'ups', 'usps', 'dhl', 'other')
- `trackingNumber` (VARCHAR(100))
- `claimAmount` (DECIMAL(10,2))
- `status` (ENUM: 'draft', 'open', 'investigating', 'evidence_gathering', 'dispute_filed', 'awaiting_response', 'under_review', 'escalated', 'resolved_won', 'resolved_lost', 'closed', DEFAULT 'draft')
- `priority` (ENUM: 'low', 'medium', 'high', 'urgent', DEFAULT 'medium')
- `createdBy` (INT, FOREIGN KEY → users.id)
- `createdAt` (TIMESTAMP, DEFAULT NOW)
- `updatedAt` (TIMESTAMP, ON UPDATE NOW)

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `caseNumber`
- INDEX on `status`
- INDEX on `carrier`
- INDEX on `trackingNumber`

**Relationships:**
- FOREIGN KEY `createdBy` REFERENCES `users(id)` ON DELETE SET NULL

#### `case_activities`
Case event timeline and audit trail.

**Columns:**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `caseId` (INT, NOT NULL, FOREIGN KEY → cases.id)
- `type` (ENUM: 'note', 'status_change', 'document_generated', 'email_sent', 'evidence_added', 'other')
- `description` (TEXT, NOT NULL)
- `metadata` (JSON) - Additional structured data
- `createdBy` (INT, FOREIGN KEY → users.id)
- `createdAt` (TIMESTAMP, DEFAULT NOW)

**Relationships:**
- FOREIGN KEY `caseId` REFERENCES `cases(id)` ON DELETE CASCADE
- FOREIGN KEY `createdBy` REFERENCES `users(id)` ON DELETE SET NULL

#### `case_documents`
Generated dispute letters and attachments.

**Columns:**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `caseId` (INT, NOT NULL, FOREIGN KEY → cases.id)
- `title` (VARCHAR(255), NOT NULL)
- `type` (ENUM: 'dispute_letter', 'evidence', 'correspondence', 'other')
- `fileUrl` (VARCHAR(500), NOT NULL) - S3 URL
- `fileKey` (VARCHAR(500), NOT NULL) - S3 key
- `mimeType` (VARCHAR(100))
- `fileSize` (INT) - Bytes
- `createdBy` (INT, FOREIGN KEY → users.id)
- `createdAt` (TIMESTAMP, DEFAULT NOW)

**Relationships:**
- FOREIGN KEY `caseId` REFERENCES `cases(id)` ON DELETE CASCADE
- FOREIGN KEY `createdBy` REFERENCES `users(id)` ON DELETE SET NULL

#### `carrier_terms`
Carrier terms and conditions for dispute citations.

**Columns:**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `carrier` (ENUM: 'fedex', 'ups', 'usps', 'dhl', 'other', NOT NULL)
- `category` (VARCHAR(100), NOT NULL)
- `title` (VARCHAR(255), NOT NULL)
- `content` (TEXT, NOT NULL)
- `reference` (VARCHAR(255)) - Policy reference number
- `effectiveDate` (DATE)
- `createdAt` (TIMESTAMP, DEFAULT NOW)
- `updatedAt` (TIMESTAMP, ON UPDATE NOW)

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `carrier`
- INDEX on `category`

---

### Email Integration Module

#### `email_accounts`
Email account configuration for tracking.

**Columns:**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `email` (VARCHAR(320), UNIQUE, NOT NULL)
- `provider` (VARCHAR(50)) - Gmail, Outlook, etc.
- `accessToken` (TEXT) - Encrypted OAuth token
- `refreshToken` (TEXT) - Encrypted refresh token
- `isActive` (BOOLEAN, DEFAULT TRUE)
- `lastSyncedAt` (TIMESTAMP)
- `createdAt` (TIMESTAMP, DEFAULT NOW)
- `updatedAt` (TIMESTAMP, ON UPDATE NOW)

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `email`

#### `email_messages`
Tracked email messages.

**Columns:**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `accountId` (INT, NOT NULL, FOREIGN KEY → email_accounts.id)
- `messageId` (VARCHAR(255), UNIQUE, NOT NULL) - Provider message ID
- `threadId` (VARCHAR(255)) - Email thread identifier
- `subject` (VARCHAR(500))
- `from` (VARCHAR(320))
- `to` (TEXT) - JSON array of recipients
- `cc` (TEXT) - JSON array
- `bcc` (TEXT) - JSON array
- `body` (TEXT)
- `bodyHtml` (TEXT)
- `receivedAt` (TIMESTAMP)
- `isRead` (BOOLEAN, DEFAULT FALSE)
- `hasAttachments` (BOOLEAN, DEFAULT FALSE)
- `labels` (TEXT) - JSON array
- `createdAt` (TIMESTAMP, DEFAULT NOW)

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `messageId`
- INDEX on `accountId`
- INDEX on `threadId`
- INDEX on `receivedAt`

**Relationships:**
- FOREIGN KEY `accountId` REFERENCES `email_accounts(id)` ON DELETE CASCADE

#### `email_attachments`
Email attachment metadata.

**Columns:**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `messageId` (INT, NOT NULL, FOREIGN KEY → email_messages.id)
- `filename` (VARCHAR(255), NOT NULL)
- `mimeType` (VARCHAR(100))
- `size` (INT) - Bytes
- `attachmentId` (VARCHAR(255)) - Provider attachment ID
- `fileUrl` (VARCHAR(500)) - S3 URL if downloaded
- `fileKey` (VARCHAR(500)) - S3 key
- `createdAt` (TIMESTAMP, DEFAULT NOW)

**Relationships:**
- FOREIGN KEY `messageId` REFERENCES `email_messages(id)` ON DELETE CASCADE

#### `activities_attachments`
Link attachments to CRM activities.

**Columns:**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `activityId` (INT, NOT NULL)
- `activityType` (ENUM: 'customer', 'lead', 'vendor', 'case')
- `attachmentId` (INT, NOT NULL, FOREIGN KEY → email_attachments.id)
- `createdAt` (TIMESTAMP, DEFAULT NOW)

**Relationships:**
- FOREIGN KEY `attachmentId` REFERENCES `email_attachments(id)` ON DELETE CASCADE

---

### Product & Inventory Module

#### `products`
Product catalog with WooCommerce integration.

**Columns:**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `woocommerceId` (INT, UNIQUE)
- `sku` (VARCHAR(100), UNIQUE)
- `name` (VARCHAR(255), NOT NULL)
- `description` (TEXT)
- `type` (ENUM: 'simple', 'variable', 'grouped', 'external')
- `status` (ENUM: 'active', 'inactive', 'discontinued', DEFAULT 'active')
- `price` (DECIMAL(10,2))
- `salePrice` (DECIMAL(10,2))
- `cost` (DECIMAL(10,2))
- `stockQuantity` (INT, DEFAULT 0)
- `lowStockThreshold` (INT, DEFAULT 10)
- `imageUrl` (VARCHAR(500))
- `weight` (DECIMAL(10,2))
- `dimensions` (VARCHAR(100)) - LxWxH
- `categories` (TEXT) - JSON array
- `tags` (TEXT) - JSON array
- `createdAt` (TIMESTAMP, DEFAULT NOW)
- `updatedAt` (TIMESTAMP, ON UPDATE NOW)

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `woocommerceId`
- UNIQUE INDEX on `sku`
- INDEX on `status`

#### `product_variants`
Product variations for variable products.

**Columns:**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `productId` (INT, NOT NULL, FOREIGN KEY → products.id)
- `woocommerceId` (INT, UNIQUE)
- `sku` (VARCHAR(100), UNIQUE)
- `name` (VARCHAR(255))
- `attributes` (TEXT) - JSON object (size, color, etc.)
- `price` (DECIMAL(10,2))
- `salePrice` (DECIMAL(10,2))
- `cost` (DECIMAL(10,2))
- `stockQuantity` (INT, DEFAULT 0)
- `imageUrl` (VARCHAR(500))
- `isActive` (BOOLEAN, DEFAULT TRUE)
- `createdAt` (TIMESTAMP, DEFAULT NOW)
- `updatedAt` (TIMESTAMP, ON UPDATE NOW)

**Relationships:**
- FOREIGN KEY `productId` REFERENCES `products(id)` ON DELETE CASCADE

---

### Order Management Module

#### `orders`
Multi-channel order processing.

**Columns:**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `orderNumber` (VARCHAR(100), UNIQUE, NOT NULL)
- `woocommerceId` (INT, UNIQUE)
- `shipstationId` (INT, UNIQUE)
- `customerId` (INT, FOREIGN KEY → customers.id)
- `status` (ENUM: 'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')
- `channel` (ENUM: 'woocommerce', 'shipstation', 'manual', 'ebay', 'amazon')
- `total` (DECIMAL(10,2), NOT NULL)
- `subtotal` (DECIMAL(10,2))
- `tax` (DECIMAL(10,2))
- `shipping` (DECIMAL(10,2))
- `discount` (DECIMAL(10,2))
- `shippingAddress` (TEXT)
- `billingAddress` (TEXT)
- `trackingNumber` (VARCHAR(100))
- `carrier` (VARCHAR(50))
- `notes` (TEXT)
- `orderDate` (TIMESTAMP)
- `shippedDate` (TIMESTAMP)
- `deliveredDate` (TIMESTAMP)
- `createdAt` (TIMESTAMP, DEFAULT NOW)
- `updatedAt` (TIMESTAMP, ON UPDATE NOW)

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `orderNumber`
- UNIQUE INDEX on `woocommerceId`
- UNIQUE INDEX on `shipstationId`
- INDEX on `customerId`
- INDEX on `status`
- INDEX on `channel`
- INDEX on `trackingNumber`

**Relationships:**
- FOREIGN KEY `customerId` REFERENCES `customers(id)` ON DELETE SET NULL

#### `order_items`
Line items for each order.

**Columns:**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `orderId` (INT, NOT NULL, FOREIGN KEY → orders.id)
- `productId` (INT, FOREIGN KEY → products.id)
- `variantId` (INT, FOREIGN KEY → product_variants.id)
- `sku` (VARCHAR(100))
- `name` (VARCHAR(255), NOT NULL)
- `quantity` (INT, NOT NULL)
- `price` (DECIMAL(10,2), NOT NULL)
- `total` (DECIMAL(10,2), NOT NULL)
- `createdAt` (TIMESTAMP, DEFAULT NOW)

**Relationships:**
- FOREIGN KEY `orderId` REFERENCES `orders(id)` ON DELETE CASCADE
- FOREIGN KEY `productId` REFERENCES `products(id)` ON DELETE SET NULL
- FOREIGN KEY `variantId` REFERENCES `product_variants(id)` ON DELETE SET NULL

---

### Calendar & Tasks Module

#### `calendar_meetings`
Google Calendar meeting metadata.

**Columns:**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `eventId` (VARCHAR(255), UNIQUE, NOT NULL) - Google Calendar event ID
- `entityType` (ENUM: 'customer', 'lead', 'vendor')
- `entityId` (INT, NOT NULL)
- `title` (VARCHAR(255))
- `startTime` (TIMESTAMP, NOT NULL)
- `endTime` (TIMESTAMP, NOT NULL)
- `autoTaskEnabled` (BOOLEAN, DEFAULT FALSE)
- `taskCreated` (BOOLEAN, DEFAULT FALSE)
- `createdTaskId` (INT, FOREIGN KEY → tasks.id)
- `createdAt` (TIMESTAMP, DEFAULT NOW)

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `eventId`
- INDEX on `entityType, entityId`
- INDEX on `endTime`

**Relationships:**
- FOREIGN KEY `createdTaskId` REFERENCES `tasks(id)` ON DELETE SET NULL

#### `tasks`
Task management system.

**Columns:**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `title` (VARCHAR(255), NOT NULL)
- `description` (TEXT)
- `entityType` (ENUM: 'customer', 'lead', 'vendor', 'case', 'general')
- `entityId` (INT)
- `priority` (ENUM: 'low', 'medium', 'high', 'urgent', DEFAULT 'medium')
- `status` (ENUM: 'pending', 'in_progress', 'completed', 'cancelled', DEFAULT 'pending')
- `dueDate` (TIMESTAMP)
- `assignedTo` (INT, FOREIGN KEY → users.id)
- `createdBy` (INT, FOREIGN KEY → users.id)
- `completedAt` (TIMESTAMP)
- `createdAt` (TIMESTAMP, DEFAULT NOW)
- `updatedAt` (TIMESTAMP, ON UPDATE NOW)

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `entityType, entityId`
- INDEX on `status`
- INDEX on `assignedTo`
- INDEX on `dueDate`

**Relationships:**
- FOREIGN KEY `assignedTo` REFERENCES `users(id)` ON DELETE SET NULL
- FOREIGN KEY `createdBy` REFERENCES `users(id)` ON DELETE SET NULL

---

### AI Intelligence Module

#### `ai_agents`
AI agent registry for enterprise organization.

**Columns:**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `agentId` (VARCHAR(100), UNIQUE, NOT NULL)
- `name` (VARCHAR(255), NOT NULL)
- `role` (VARCHAR(100), NOT NULL)
- `department` (VARCHAR(100))
- `level` (ENUM: 'executive', 'manager', 'specialist')
- `reportsTo` (VARCHAR(100)) - Parent agent ID
- `capabilities` (TEXT) - JSON array
- `systemPrompt` (TEXT)
- `isActive` (BOOLEAN, DEFAULT TRUE)
- `createdAt` (TIMESTAMP, DEFAULT NOW)
- `updatedAt` (TIMESTAMP, ON UPDATE NOW)

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `agentId`
- INDEX on `role`
- INDEX on `department`

#### `ai_agent_memory`
Extended memory system for agents.

**Columns:**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `agentId` (VARCHAR(100), NOT NULL, FOREIGN KEY → ai_agents.agentId)
- `memoryType` (ENUM: 'short_term', 'long_term', 'episodic', 'semantic')
- `content` (TEXT, NOT NULL)
- `context` (TEXT) - JSON metadata
- `importance` (INT, DEFAULT 5) - 1-10 scale
- `expiresAt` (TIMESTAMP)
- `createdAt` (TIMESTAMP, DEFAULT NOW)

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `agentId`
- INDEX on `memoryType`
- INDEX on `expiresAt`

**Relationships:**
- FOREIGN KEY `agentId` REFERENCES `ai_agents(agentId)` ON DELETE CASCADE

#### `launch_missions`
Mission control system for coordinated operations.

**Columns:**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `missionId` (VARCHAR(100), UNIQUE, NOT NULL)
- `name` (VARCHAR(255), NOT NULL)
- `objective` (TEXT, NOT NULL)
- `status` (ENUM: 'planning', 'ready', 'active', 'paused', 'completed', 'aborted', DEFAULT 'planning')
- `priority` (ENUM: 'low', 'medium', 'high', 'critical', DEFAULT 'medium')
- `assignedAgents` (TEXT) - JSON array of agent IDs
- `startTime` (TIMESTAMP)
- `endTime` (TIMESTAMP)
- `progress` (INT, DEFAULT 0) - Percentage
- `createdBy` (INT, FOREIGN KEY → users.id)
- `createdAt` (TIMESTAMP, DEFAULT NOW)
- `updatedAt` (TIMESTAMP, ON UPDATE NOW)

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `missionId`
- INDEX on `status`
- INDEX on `priority`

**Relationships:**
- FOREIGN KEY `createdBy` REFERENCES `users(id)` ON DELETE SET NULL

#### `mission_events`
Real-time event tracking for missions.

**Columns:**
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `missionId` (VARCHAR(100), NOT NULL, FOREIGN KEY → launch_missions.missionId)
- `eventType` (ENUM: 'status_change', 'agent_action', 'milestone', 'alert', 'log')
- `severity` (ENUM: 'info', 'warning', 'error', 'critical', DEFAULT 'info')
- `message` (TEXT, NOT NULL)
- `metadata` (TEXT) - JSON data
- `createdAt` (TIMESTAMP, DEFAULT NOW)

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `missionId`
- INDEX on `eventType`
- INDEX on `createdAt`

**Relationships:**
- FOREIGN KEY `missionId` REFERENCES `launch_missions(missionId)` ON DELETE CASCADE

---

## Database Restoration Instructions

### Prerequisites
- MySQL 8.0+ or TiDB compatible database
- Node.js 22.13.0+
- pnpm package manager

### Step 1: Clone Repository
```bash
gh repo clone ctfoutdoors/Hellcat-Ai-Oct-31-2025-10.12pm hellcat-intelligence
cd hellcat-intelligence
git checkout snapshot-2025-11-25
```

### Step 2: Install Dependencies
```bash
pnpm install
```

### Step 3: Configure Database Connection
Set the DATABASE_URL environment variable:
```bash
export DATABASE_URL="mysql://user:password@host:port/database?ssl=true"
```

### Step 4: Push Schema to Database
```bash
pnpm db:push
```

This command will:
- Read the schema from `drizzle/schema.ts`
- Generate SQL migrations
- Apply all table structures to the database
- Create indexes and foreign keys

### Step 5: Verify Schema
```bash
pnpm drizzle-kit studio
```

This opens a web interface to browse the database schema and data.

---

## Migration Management

### Generate New Migration
```bash
pnpm drizzle-kit generate
```

### Apply Migrations
```bash
pnpm db:push
```

### View Migration History
```bash
ls -la drizzle/
```

---

## Performance Considerations

### Recommended Indexes
All critical indexes are defined in the schema. Key performance indexes include:

- `cases.status` - Fast case filtering
- `cases.trackingNumber` - Quick lookup by tracking
- `email_messages.receivedAt` - Chronological email queries
- `orders.orderDate` - Date range queries
- `products.sku` - Product lookup
- `tasks.dueDate` - Task scheduling queries

### Query Optimization
- Use Drizzle ORM query builder for type-safe queries
- Leverage foreign key relationships for joins
- Implement pagination for large result sets
- Use database connection pooling

---

## Data Integrity

### Foreign Key Constraints
All relationships enforce referential integrity with appropriate CASCADE or SET NULL behaviors.

### Unique Constraints
- User `openId` prevents duplicate accounts
- Case `caseNumber` ensures unique case identifiers
- Product `sku` prevents inventory conflicts
- Email `messageId` prevents duplicate message imports

---

## Backup Recommendations

### Daily Backups
```bash
mysqldump -u user -p database > backup-$(date +%Y%m%d).sql
```

### Schema-Only Backup
```bash
mysqldump -u user -p --no-data database > schema-only.sql
```

### Automated Backup Script
Located at: `export-db-schema.sh`

---

## Security Notes

- All passwords and tokens are encrypted at rest
- Database credentials must be stored in environment variables
- Use SSL/TLS for database connections in production
- Implement row-level security for multi-tenant scenarios
- Regular security audits recommended

---

## Support & Maintenance

For schema modifications:
1. Edit `drizzle/schema.ts`
2. Run `pnpm db:push` to apply changes
3. Test thoroughly in development
4. Create checkpoint before deploying to production

For data migrations:
1. Create custom migration scripts in `drizzle/` folder
2. Test with sample data
3. Execute during maintenance window
4. Verify data integrity post-migration

---

**End of Database Schema Documentation**
