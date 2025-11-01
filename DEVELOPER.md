# Developer Documentation - Carrier Dispute System

Internal technical documentation for developers working on the Carrier Dispute System.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Database Schema](#database-schema)
4. [Backend Services](#backend-services)
5. [Frontend Components](#frontend-components)
6. [API Endpoints](#api-endpoints)
7. [Authentication & Security](#authentication--security)
8. [Integrations](#integrations)
9. [Development Workflow](#development-workflow)
10. [Testing](#testing)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Tech Stack

**Frontend:**
- React 19 with TypeScript
- TailwindCSS 4 for styling
- shadcn/ui component library
- tRPC client for type-safe API calls
- React Router for navigation
- Zustand for state management (if needed)

**Backend:**
- Node.js 22.x
- Express 4 for HTTP server
- tRPC 11 for type-safe RPC
- Drizzle ORM for database
- PostgreSQL for data storage

**External Services:**
- OpenAI GPT-4 for AI letter generation
- ShipStation API for shipment data
- WooCommerce REST API for orders
- Google Sheets API for imports
- SMTP for email delivery

**Infrastructure:**
- Manus deployment platform
- Auto-scaling with CDN
- PostgreSQL managed database
- S3-compatible storage for files

### System Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────┐
│   React     │
│   Frontend  │
└──────┬──────┘
       │ tRPC
       ▼
┌─────────────┐
│   Express   │
│   Backend   │
└──────┬──────┘
       │
       ├──────► PostgreSQL Database
       ├──────► OpenAI API
       ├──────► ShipStation API
       ├──────► WooCommerce API
       ├──────► Google Sheets API
       └──────► SMTP Server
```

---

## Project Structure

```
carrier-dispute-system/
├── client/                 # Frontend code
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   ├── types/         # TypeScript types
│   │   └── App.tsx        # Main app component
│   ├── public/            # Static assets
│   └── package.json
│
├── server/                # Backend code
│   ├── _core/            # Server initialization
│   ├── routers/          # tRPC routers
│   ├── services/         # Business logic services
│   ├── db/               # Database functions
│   └── middleware/       # Express middleware
│
├── drizzle/              # Database schema & migrations
│   └── schema.ts         # Database schema definition
│
├── docs/                 # Documentation
│   ├── README.md
│   ├── WIKI.md
│   ├── DEVELOPER.md
│   └── API.md
│
├── todo.md               # Feature tracking
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript config
```

---

## Database Schema

### Tables

**cases** (57 fields)
Primary table storing all case data.

**Key Fields:**
- `id` (serial, primary key)
- `caseNumber` (varchar, unique) - e.g., "CASE-05088"
- `status` (enum) - DRAFT, FILED, AWAITING_RESPONSE, RESOLVED, CLOSED, REJECTED
- `priority` (enum) - LOW, MEDIUM, HIGH, URGENT
- `caseType` (enum) - DAMAGE, ADJUSTMENT, SLA
- `carrier` (varchar) - FEDEX, UPS, USPS, DHL, OTHER
- `trackingId` (varchar)
- `orderNumber` (varchar)
- `shipmentNumber` (varchar)

**Customer Fields:**
- `recipientName` (varchar)
- `recipientEmail` (varchar)
- `recipientPhone` (varchar)
- `recipientStatus` (enum) - ACTIVE, INACTIVE, ON_HOLD

**Financial Fields:**
- `originalAmount` (decimal)
- `adjustedAmount` (decimal)
- `claimedAmount` (decimal)
- `recoveredAmount` (decimal)

**Damage Documentation Fields:**
- `damageType` (varchar) - Comma-separated: tube, rod, tip, bent_eye, structural
- `damageDescription` (text)
- `damageTubePhoto` (boolean)
- `damageRodPhoto` (boolean)
- `damageTipPhoto` (boolean)
- `damageBentEyePhoto` (boolean)
- `damageStructuralPhoto` (boolean)
- `damagePackagingPhoto` (boolean)

**Purchase Verification Fields:**
- `purchaseDate` (date)
- `purchaseSource` (enum) - AUTHORIZED_DEALER, DIRECT, THIRD_PARTY, OTHER
- `purchaseVerified` (boolean)
- `purchaseVerificationNotes` (text)
- `receiptRequired` (boolean)
- `receiptUploaded` (boolean)
- `warrantyEligible` (boolean)
- `warrantyExpirationDate` (date)

**Insurance Fields:**
- `insurancePolicy` (varchar)
- `insuranceProvider` (varchar)
- `insurancePolicyNumber` (varchar)
- `insuranceCoverage` (decimal)
- `insuranceClaimNumber` (varchar)
- `insuranceClaimStatus` (varchar)

**Carrier Guarantee Fields:**
- `carrierGuarantee` (boolean)
- `carrierGuaranteeClaimNumber` (varchar)
- `carrierGuaranteeStatus` (varchar)

**Timestamps:**
- `createdAt` (timestamp)
- `updatedAt` (timestamp)
- `shipDate` (date)
- `deliveryDate` (date)

### Indexes

- `idx_cases_tracking` on `trackingId`
- `idx_cases_order` on `orderNumber`
- `idx_cases_status` on `status`
- `idx_cases_carrier` on `carrier`
- `idx_cases_email` on `recipientEmail`

### Migrations

Run migrations with:
```bash
pnpm db:push
```

This command:
1. Generates migration SQL from schema
2. Applies migrations to database
3. Updates schema snapshot

---

## Backend Services

### Service Architecture

Services encapsulate business logic and external API calls. Located in `server/services/`.

### Key Services

#### documentService.ts
Generates dispute letters using OpenAI.

**Functions:**
- `generateDisputeLetter(caseData, tone)` - Generate letter
- `generateDisputeLetterWord(caseData, tone)` - Generate Word document
- `getLetterTemplate(caseType, carrier)` - Get template

**Usage:**
```typescript
import { generateDisputeLetter } from '../services/documentService';

const letter = await generateDisputeLetter({
  caseNumber: 'CASE-05088',
  trackingId: '123456789',
  carrier: 'FEDEX',
  claimedAmount: 50.00,
  damageDescription: 'Bent fishing rod',
}, 'PROFESSIONAL');
```

#### evidencePackage.ts
Builds evidence packages (ZIP files).

**Functions:**
- `buildEvidencePackage(caseId)` - Create ZIP package
- `gatherDocuments(caseId)` - Collect all documents
- `generateCoverLetter(caseData)` - Create cover letter

**Package Structure:**
```
evidence-package-CASE-05088.zip
├── Cover_Letter.pdf
├── Appendix_A_Certification.pdf
├── Appendix_B_ShipStation_Record.pdf
├── Appendix_C_3PL_Documents.pdf
├── Appendix_D_Photos.pdf
└── Appendix_E_Invoice.pdf
```

#### pdfCompilationService.ts
Compiles all evidence into single PDF.

**Functions:**
- `compileEvidencePDF(caseId)` - Merge all PDFs
- `addCoverPage(pdf, caseData)` - Add cover page
- `addTableOfContents(pdf, sections)` - Add TOC

**Usage:**
```typescript
import { compileEvidencePDF } from '../services/pdfCompilationService';

const pdfBuffer = await compileEvidencePDF(caseId);
// Returns Buffer containing compiled PDF
```

#### shipstationSync.ts
Syncs data from ShipStation API.

**Functions:**
- `syncShipments(startDate, endDate)` - Sync shipments
- `getShipmentByTracking(trackingNumber)` - Get single shipment
- `updateCaseFromShipment(caseId, shipmentData)` - Update case

**Sync Schedule:**
- Runs daily at 2:00 AM via `syncScheduler.ts`
- Can be triggered manually via API

#### emailMonitoringService.ts
Monitors emails and updates case status.

**Functions:**
- `processIncomingEmail(email)` - Parse and update status
- `detectStatus(emailBody)` - Extract status from keywords
- `runTimeBasedRules()` - Apply time-based status changes

**Keyword Mapping:**
```typescript
const statusKeywords = {
  RESOLVED: ['approved', 'accepted', 'granted'],
  REJECTED: ['denied', 'declined', 'rejected'],
  AWAITING_RESPONSE: ['pending', 'under review', 'requires information'],
};
```

#### reminderService.ts
Manages follow-up reminders.

**Functions:**
- `createReminder(caseId, date, note)` - Create reminder
- `getUpcomingReminders()` - Get due reminders
- `sendReminderEmail(reminder)` - Send email notification
- `autoCreateReminders(caseId)` - Auto-create based on rules

**Auto-Creation Rules:**
```typescript
// Draft for 7 days → Reminder to file
// Awaiting Response for 14 days → Follow-up
// Awaiting Response for 30 days → Escalation
```

#### webhookService.ts
Handles incoming webhooks from external systems.

**Functions:**
- `handleTypeformWebhook(payload)` - Process Typeform submission
- `handleGoogleSheetsWebhook(payload)` - Process Sheets update
- `triggerOutgoingWebhook(event, data)` - Send webhook to subscribers

**Webhook Events:**
- `case.created`
- `case.updated`
- `case.resolved`
- `status.changed`

#### purchaseVerificationService.ts
Verifies customer purchases.

**Functions:**
- `verifyPurchase(orderNumber, email)` - Check WooCommerce
- `checkWarrantyEligibility(purchaseDate)` - Validate warranty
- `requestReceipt(caseId)` - Send receipt request email

**Verification Flow:**
```typescript
1. Check WooCommerce for order
2. Match customer email
3. Verify purchase date
4. Calculate warranty expiration
5. Flag if third-party purchase
6. Request receipt if needed
```

#### insuranceClaimService.ts
Manages insurance and carrier guarantee claims.

**Functions:**
- `fileInsuranceClaim(caseId, insuranceData)` - File insurance
- `fileCarrierGuarantee(caseId)` - File carrier guarantee
- `checkEligibility(caseId, claimType)` - Check if eligible
- `updateClaimStatus(claimNumber, status)` - Update status

**Dual-Filing:**
```typescript
// File both insurance and carrier guarantee
await fileInsuranceClaim(caseId, insuranceData);
await fileCarrierGuarantee(caseId);
// Track both claim numbers and statuses separately
```

#### googleSheetsService.ts
Imports data from Google Sheets.

**Functions:**
- `importDamageClaims(spreadsheetId, sheetName)` - Import cases
- `getSheetsClient()` - Get authenticated client
- `mapSheetRowToCase(row, headers)` - Map columns to fields

**OAuth Flow:**
1. User clicks "Connect Google Account"
2. Redirects to Google OAuth
3. User grants permissions
4. System stores refresh token
5. Auto-refreshes access token as needed

#### bulkEmailService.ts
Sends bulk emails to multiple cases.

**Functions:**
- `sendBulkEmail(caseIds, template, variables)` - Send emails
- `renderTemplate(template, caseData)` - Replace variables
- `trackEmailStatus(emailId, status)` - Track delivery

**Template Variables:**
```typescript
{{caseNumber}} → CASE-05088
{{recipientName}} → John Doe
{{trackingNumber}} → 123456789
{{claimedAmount}} → $50.00
```

#### weeklyReportsService.ts
Generates weekly performance reports.

**Functions:**
- `generateWeeklyReport(startDate, endDate)` - Generate report
- `calculateMetrics(cases)` - Calculate stats
- `generateCharts(data)` - Create chart data
- `sendReportEmail(report, recipients)` - Email report

**Report Metrics:**
- Total cases
- New cases this week
- Resolved cases this week
- Total claimed
- Total recovered
- Success rate
- Carrier breakdown
- Status breakdown

---

## Frontend Components

### Component Architecture

Components follow atomic design principles:
- **Atoms**: Basic UI elements (Button, Input, Badge)
- **Molecules**: Combinations of atoms (SearchBar, FilterDropdown)
- **Organisms**: Complex components (CaseCard, CaseDetailPage)
- **Templates**: Page layouts (DashboardLayout)
- **Pages**: Full pages (Dashboard, CasesNew, CaseDetail)

### Key Components

#### EnhancedCaseCard.tsx
Displays case information in card format with inline editing.

**Props:**
```typescript
interface EnhancedCaseCardProps {
  case: Case;
  onUpdate: (caseId: number, updates: Partial<Case>) => void;
  onDelete: (caseId: number) => void;
  selected?: boolean;
  onSelect?: (caseId: number) => void;
}
```

**Features:**
- Inline editing for key fields
- Status, priority, type badges
- Quick action buttons
- Dropdown menu for more options

#### InlineEditField.tsx
Reusable inline editing component.

**Props:**
```typescript
interface InlineEditFieldProps {
  value: string | number;
  onSave: (newValue: string | number) => Promise<void>;
  type?: 'text' | 'email' | 'tel' | 'number';
  placeholder?: string;
  prefix?: string; // e.g., "$" for amounts
  validation?: (value: string) => boolean;
}
```

**Features:**
- Hover to show edit icon
- Click to edit
- Enter to save, Esc to cancel
- Loading state during save
- Success animation
- Error handling with revert
- Undo capability (10 seconds)

#### LetterEditDialog.tsx
Dialog for editing AI-generated letters.

**Props:**
```typescript
interface LetterEditDialogProps {
  open: boolean;
  onClose: () => void;
  initialContent: string;
  caseData: Case;
}
```

**Features:**
- Preview and edit tabs
- Word/character count
- Download as TXT/PDF/DOCX
- Reset to original
- Auto-save draft

#### DeleteConfirmationDialog.tsx
Confirmation dialog for destructive actions.

**Props:**
```typescript
interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemName?: string;
}
```

**Usage:**
```typescript
<DeleteConfirmationDialog
  open={showDialog}
  onClose={() => setShowDialog(false)}
  onConfirm={handleDelete}
  title="Delete Case"
  description="This action cannot be undone."
  itemName={caseNumber}
/>
```

#### StatusFilterSelector.tsx
Multi-select filter for case status.

**Props:**
```typescript
interface StatusFilterSelectorProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}
```

**Features:**
- Multi-select checkboxes
- Filter chips
- Clear all button
- Persistent selection (localStorage)

#### Pagination.tsx
Pagination controls for case list.

**Props:**
```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
}
```

**Features:**
- First/Previous/Next/Last buttons
- Page number display
- Items per page selector (25/50/100/250/500)
- Persistent preferences

#### CaseTypeSelector.tsx
Selector for case type during creation.

**Props:**
```typescript
interface CaseTypeSelectorProps {
  value: 'DAMAGE' | 'ADJUSTMENT' | 'SLA';
  onChange: (type: 'DAMAGE' | 'ADJUSTMENT' | 'SLA') => void;
}
```

**Features:**
- Visual cards for each type
- Description of each type
- Icon for each type
- Highlights selected type

#### DamageDocumentationForm.tsx
Form for documenting damage claims.

**Props:**
```typescript
interface DamageDocumentationFormProps {
  caseId: number;
  initialData?: DamageData;
  onSave: (data: DamageData) => void;
}
```

**Features:**
- Photo upload checklist
- Damage type multi-select
- Description text area
- Packaging condition notes
- Completion percentage indicator

---

## API Endpoints

### tRPC Routers

All API endpoints use tRPC for type-safe communication.

#### cases Router

**cases.getAll**
```typescript
// Get all cases with optional filters
input: {
  status?: string[];
  caseType?: string[];
  carrier?: string;
  search?: string;
  page?: number;
  limit?: number;
}
output: {
  cases: Case[];
  total: number;
  page: number;
  totalPages: number;
}
```

**cases.getById**
```typescript
// Get single case by ID
input: { id: number }
output: Case
```

**cases.create**
```typescript
// Create new case
input: Partial<Case>
output: Case
```

**cases.update**
```typescript
// Update case
input: { id: number; updates: Partial<Case> }
output: Case
```

**cases.delete**
```typescript
// Delete case
input: { id: number }
output: { success: boolean }
```

**cases.bulkUpdate**
```typescript
// Update multiple cases
input: {
  ids: number[];
  updates: Partial<Case>;
}
output: {
  updated: number;
  failed: number;
}
```

#### documents Router

**documents.generateDisputeLetter**
```typescript
// Generate AI dispute letter
input: {
  caseId: number;
  tone: 'PROFESSIONAL' | 'FIRM' | 'ESCALATED';
}
output: {
  content: string;
  wordCount: number;
}
```

**documents.generateDisputeLetterWord**
```typescript
// Generate Word document
input: {
  caseId: number;
  tone: 'PROFESSIONAL' | 'FIRM' | 'ESCALATED';
}
output: {
  buffer: Buffer;
  filename: string;
}
```

**documents.buildEvidencePackage**
```typescript
// Build evidence ZIP package
input: { caseId: number }
output: {
  buffer: Buffer;
  filename: string;
}
```

**documents.compileEvidencePDF**
```typescript
// Compile evidence as single PDF
input: { caseId: number }
output: {
  buffer: Buffer;
  filename: string;
}
```

**documents.sendBulkEmail**
```typescript
// Send bulk email
input: {
  caseIds: number[];
  subject: string;
  body: string;
  template?: string;
}
output: {
  sent: number;
  failed: number;
  errors: string[];
}
```

#### webhooks Router

**webhooks.typeform**
```typescript
// Handle Typeform webhook
input: TypeformPayload
output: {
  success: boolean;
  caseId?: number;
  error?: string;
}
```

**webhooks.googleSheets**
```typescript
// Handle Google Sheets webhook
input: GoogleSheetsPayload
output: {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
}
```

**webhooks.incoming**
```typescript
// Generic webhook handler
input: any
output: {
  success: boolean;
  message: string;
}
```

#### reminders Router

**reminders.create**
```typescript
// Create reminder
input: {
  caseId: number;
  date: Date;
  note: string;
  recurring?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}
output: Reminder
```

**reminders.getUpcoming**
```typescript
// Get upcoming reminders
input: { days?: number }
output: Reminder[]
```

**reminders.markComplete**
```typescript
// Mark reminder complete
input: { id: number }
output: { success: boolean }
```

#### insuranceClaims Router

**insuranceClaims.file**
```typescript
// File insurance claim
input: {
  caseId: number;
  provider: string;
  policyNumber: string;
  coverage: number;
}
output: {
  claimNumber: string;
  status: string;
}
```

**insuranceClaims.fileCarrierGuarantee**
```typescript
// File carrier guarantee claim
input: { caseId: number }
output: {
  claimNumber: string;
  eligible: boolean;
  reason?: string;
}
```

**insuranceClaims.checkEligibility**
```typescript
// Check claim eligibility
input: {
  caseId: number;
  claimType: 'INSURANCE' | 'CARRIER_GUARANTEE';
}
output: {
  eligible: boolean;
  reason?: string;
  recommendations: string[];
}
```

#### purchaseVerification Router

**purchaseVerification.verify**
```typescript
// Verify purchase
input: {
  orderNumber: string;
  email: string;
}
output: {
  verified: boolean;
  purchaseDate?: Date;
  warrantyEligible: boolean;
  warrantyExpiration?: Date;
  source: string;
}
```

**purchaseVerification.requestReceipt**
```typescript
// Request receipt from customer
input: { caseId: number }
output: {
  emailSent: boolean;
  message: string;
}
```

---

## Authentication & Security

### JWT Authentication

**Token Structure:**
```typescript
{
  userId: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  iat: number; // issued at
  exp: number; // expiration
}
```

**Token Generation:**
```typescript
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { userId, email, name, role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
```

**Token Verification:**
```typescript
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

### Middleware

**authMiddleware.ts**
```typescript
export const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Environment Variables

**Required:**
- `JWT_SECRET` - Secret for signing JWTs
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key
- `SHIPSTATION_API_KEY` - ShipStation API key
- `SHIPSTATION_API_SECRET` - ShipStation API secret
- `WOOCOMMERCE_STORE_URL` - WooCommerce store URL
- `WOOCOMMERCE_CONSUMER_KEY` - WooCommerce consumer key
- `WOOCOMMERCE_CONSUMER_SECRET` - WooCommerce consumer secret
- `SMTP_HOST` - SMTP server host
- `SMTP_PORT` - SMTP server port
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password

**Optional:**
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret

### Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Validate all inputs** - Use Zod schemas in tRPC
3. **Sanitize user input** - Prevent XSS attacks
4. **Use HTTPS** - Always in production
5. **Rate limiting** - Prevent abuse
6. **SQL injection prevention** - Use parameterized queries (Drizzle ORM)
7. **CORS configuration** - Restrict origins in production
8. **Webhook signatures** - Verify webhook authenticity

---

## Integrations

### ShipStation API

**Base URL:** `https://ssapi.shipstation.com`

**Authentication:**
```typescript
const auth = Buffer.from(
  `${SHIPSTATION_API_KEY}:${SHIPSTATION_API_SECRET}`
).toString('base64');

headers: {
  'Authorization': `Basic ${auth}`
}
```

**Key Endpoints:**
- `GET /shipments` - List shipments
- `GET /shipments/:id` - Get shipment details
- `GET /orders` - List orders

**Rate Limits:**
- 40 requests per minute
- Implement exponential backoff

### WooCommerce REST API

**Base URL:** `{WOOCOMMERCE_STORE_URL}/wp-json/wc/v3`

**Authentication:**
```typescript
const auth = {
  username: WOOCOMMERCE_CONSUMER_KEY,
  password: WOOCOMMERCE_CONSUMER_SECRET
};
```

**Key Endpoints:**
- `GET /orders` - List orders
- `GET /orders/:id` - Get order details
- `GET /products` - List products

**Rate Limits:**
- Varies by hosting
- Implement caching

### OpenAI API

**Base URL:** `https://api.openai.com/v1`

**Authentication:**
```typescript
headers: {
  'Authorization': `Bearer ${OPENAI_API_KEY}`,
  'Content-Type': 'application/json'
}
```

**Key Endpoints:**
- `POST /chat/completions` - Generate text

**Model:** `gpt-4`

**Rate Limits:**
- 10,000 requests per minute
- 2,000,000 tokens per minute

### Google Sheets API

**Base URL:** `https://sheets.googleapis.com/v4`

**Authentication:** OAuth 2.0

**Key Endpoints:**
- `GET /spreadsheets/:id/values/:range` - Read values
- `POST /spreadsheets/:id/values/:range:append` - Append values

**Scopes:**
- `https://www.googleapis.com/auth/spreadsheets.readonly`
- `https://www.googleapis.com/auth/drive.readonly`

---

## Development Workflow

### Setup

1. **Clone repository**
   ```bash
   git clone <repo-url>
   cd carrier-dispute-system
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment**
   - Copy `.env.example` to `.env`
   - Fill in required secrets

4. **Setup database**
   ```bash
   pnpm db:push
   ```

5. **Start dev server**
   ```bash
   pnpm dev
   ```

### Development Commands

```bash
# Start dev server (frontend + backend)
pnpm dev

# Build for production
pnpm build

# Run linter
pnpm lint

# Run type check
pnpm type-check

# Generate database migrations
pnpm db:generate

# Apply database migrations
pnpm db:push

# Open database studio
pnpm db:studio
```

### Git Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and commit**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

3. **Push to remote**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create pull request**
   - Review changes
   - Request review from team
   - Merge after approval

### Commit Message Convention

Follow conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

---

## Testing

### Unit Tests

**Location:** `__tests__/unit/`

**Run tests:**
```bash
pnpm test:unit
```

**Example:**
```typescript
// __tests__/unit/documentService.test.ts
import { generateDisputeLetter } from '../../server/services/documentService';

describe('documentService', () => {
  it('should generate dispute letter', async () => {
    const letter = await generateDisputeLetter({
      caseNumber: 'TEST-001',
      trackingId: '123456789',
      carrier: 'FEDEX',
      claimedAmount: 50.00,
    }, 'PROFESSIONAL');
    
    expect(letter).toContain('TEST-001');
    expect(letter).toContain('123456789');
  });
});
```

### Integration Tests

**Location:** `__tests__/integration/`

**Run tests:**
```bash
pnpm test:integration
```

**Example:**
```typescript
// __tests__/integration/cases.test.ts
import { trpc } from '../../client/src/lib/trpc';

describe('cases API', () => {
  it('should create and retrieve case', async () => {
    const created = await trpc.cases.create.mutate({
      caseNumber: 'TEST-001',
      status: 'DRAFT',
      recipientEmail: 'test@example.com',
    });
    
    expect(created.id).toBeDefined();
    
    const retrieved = await trpc.cases.getById.query({ id: created.id });
    expect(retrieved.caseNumber).toBe('TEST-001');
  });
});
```

### E2E Tests

**Location:** `__tests__/e2e/`

**Run tests:**
```bash
pnpm test:e2e
```

**Example:**
```typescript
// __tests__/e2e/create-case.test.ts
import { test, expect } from '@playwright/test';

test('create case flow', async ({ page }) => {
  await page.goto('/');
  await page.click('text=New Case');
  await page.fill('[name="recipientEmail"]', 'test@example.com');
  await page.fill('[name="trackingId"]', '123456789');
  await page.click('text=Create Case');
  
  await expect(page).toHaveURL(/\/cases\/\d+/);
  await expect(page.locator('text=CASE-')).toBeVisible();
});
```

---

## Deployment

### Production Build

```bash
# Build frontend and backend
pnpm build

# Output:
# - client/dist/ - Frontend static files
# - server/dist/ - Backend compiled JS
```

### Environment Variables

Set in production:
- All required secrets
- `NODE_ENV=production`
- `DATABASE_URL` - Production database
- `PORT` - Server port (default 3000)

### Database Migrations

Run migrations in production:
```bash
pnpm db:push
```

**Important:** Always backup database before migrations!

### Deployment Checklist

- [ ] Update environment variables
- [ ] Run database migrations
- [ ] Build production assets
- [ ] Test critical flows
- [ ] Monitor error logs
- [ ] Verify integrations working
- [ ] Check email delivery
- [ ] Test webhook endpoints

---

## Troubleshooting

### Common Issues

**Issue: Database connection fails**

**Solution:**
- Check `DATABASE_URL` is correct
- Verify database is running
- Check network connectivity
- Verify SSL settings

**Issue: tRPC calls fail with 401**

**Solution:**
- Check JWT token is valid
- Verify `Authorization` header present
- Check `JWT_SECRET` matches
- Token may be expired (7 day expiry)

**Issue: OpenAI API calls fail**

**Solution:**
- Check `OPENAI_API_KEY` is valid
- Verify API key has credits
- Check rate limits not exceeded
- Review error message for details

**Issue: ShipStation sync fails**

**Solution:**
- Check API credentials
- Verify account has API access
- Check rate limits (40/min)
- Review sync logs for errors

**Issue: Emails not sending**

**Solution:**
- Check SMTP credentials
- Verify SMTP server allows connections
- Test SMTP connection
- Check spam folder
- Enable "Less secure apps" (Gmail)
- Use app password if 2FA enabled

### Debug Mode

Enable debug logging:
```typescript
// server/_core/index.ts
const DEBUG = process.env.DEBUG === 'true';

if (DEBUG) {
  console.log('Debug mode enabled');
  // Log all requests
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}
```

### Logging

**Backend logs:**
```typescript
import { logger } from './logger';

logger.info('Case created', { caseId: 123 });
logger.error('Failed to sync', { error: err.message });
```

**Frontend logs:**
```typescript
console.log('[CaseCard]', 'Rendering case', caseId);
console.error('[API]', 'Failed to fetch cases', error);
```

### Performance Monitoring

**Database query performance:**
```typescript
// Enable query logging in Drizzle
const db = drizzle(pool, {
  logger: true, // Log all queries
});
```

**API response times:**
```typescript
// Add timing middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${duration}ms`);
  });
  next();
});
```

---

## Contributing

### Code Style

- Use TypeScript for all new code
- Follow ESLint rules
- Use Prettier for formatting
- Write JSDoc comments for functions
- Keep functions small and focused
- Use meaningful variable names

### Pull Request Process

1. Create feature branch
2. Write tests for new features
3. Update documentation
4. Run linter and tests
5. Create pull request
6. Request code review
7. Address review comments
8. Merge after approval

### Code Review Checklist

- [ ] Code follows style guide
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console.logs in production code
- [ ] Error handling present
- [ ] Type safety maintained
- [ ] Performance considered
- [ ] Security reviewed

---

**Last Updated:** October 30, 2025  
**Version:** 1.0.0  
**Maintained by:** Catch The Fever Development Team
