# Carrier Dispute System - Complete Wiki

Complete documentation for every feature and functionality in the Carrier Dispute System.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [Case Management](#case-management)
4. [Automation Features](#automation-features)
5. [Document Generation](#document-generation)
6. [Integrations](#integrations)
7. [Settings & Configuration](#settings--configuration)
8. [Advanced Features](#advanced-features)
9. [Troubleshooting](#troubleshooting)

---

## Getting Started

### First Time Setup

1. **Access the System**
   - Navigate to your deployment URL
   - Login with your credentials
   - You'll land on the Dashboard

2. **Configure Integrations**
   - Go to Settings → Secrets
   - Add required API keys:
     - ShipStation API credentials
     - WooCommerce store credentials
     - OpenAI API key for AI features
     - SMTP credentials for emails

3. **Initial Sync**
   - Go to Data → ShipStation Sync
   - Click "Sync Now" to pull shipment data
   - Wait for sync to complete (shows progress)

4. **Create Your First Case**
   - Click "+ New Case" in header
   - Fill in required fields
   - Click "Create Case"

---

## Dashboard

### Overview Metrics

**Total Claimed**
- Sum of all claimed amounts across all cases
- Updates in real-time as cases are created/updated
- Displayed in dollars with cents

**Total Recovered**
- Sum of all successfully recovered amounts
- Only includes resolved cases with recovered amounts
- Key performance indicator

**Open Exposure**
- Total pending dispute amount
- Cases in Draft, Filed, or Awaiting Response status
- Helps track financial risk

**Success Rate**
- Percentage of resolved cases vs. total cases
- Calculated as: (Resolved Cases / Total Cases) × 100
- Target: Above 50%

### Case Status Distribution

Pie chart showing breakdown by status:
- **Draft** - Cases being prepared
- **Filed** - Submitted to carrier
- **Awaiting Response** - Waiting for carrier reply
- **Resolved** - Successfully closed
- **Closed** - Closed without recovery
- **Rejected** - Denied by carrier

### Top Carriers by Claims

Bar chart showing:
- Number of cases per carrier
- Total claimed amount per carrier
- Helps identify problematic carriers

### Monthly Trends

Line chart displaying:
- Cases filed per month
- Amount recovered per month
- Trend analysis over time

### Recent Activity

List of latest case updates:
- Case number and status
- Timestamp of last update
- Quick link to case detail

---

## Case Management

### Creating a Case

#### Step 1: Choose Case Type

**Damage Claims**
- For shipments received damaged
- Requires damage documentation
- Photo evidence needed
- Packaging assessment required

**Adjustment Claims**
- For billing/pricing disputes
- Requires invoice documentation
- Service level discrepancies

**SLA Claims**
- For delivery guarantee violations
- Requires service type proof
- Delivery date verification

#### Step 2: Customer Information

**Required Fields:**
- Recipient Name
- Recipient Email
- Recipient Phone (optional but recommended)

**Tips:**
- Email is used for verification
- Phone helps with follow-ups
- Address auto-fills from order data

#### Step 3: Shipment Details

**Required:**
- Tracking Number
- Carrier (FedEx, UPS, USPS, etc.)
- Order Number

**Optional:**
- Shipment Number
- Service Type
- Ship Date
- Delivery Date

**Auto-Fill:**
- System auto-fetches data from ShipStation if tracking number exists

#### Step 4: Financial Information

- **Original Amount**: Cost of goods/shipping
- **Adjusted Amount**: Revised claim amount
- **Claimed Amount**: Amount requesting from carrier
- **Recovered Amount**: (filled after resolution)

#### Step 5: Damage Documentation (Damage Claims Only)

**Damage Types** (select all that apply):
- Tube Damage
- Rod Damage
- Tip Damage
- Bent Eye
- Structural Damage
- Other

**Required Documentation:**
- Photo of damaged tube
- Photo of damaged rod/tip
- Photo of bent eye (if applicable)
- Photo of structural damage
- Photo of packaging
- Photo of spacing within package

**Damage Description:**
- Detailed text description
- Include measurements if applicable
- Note any safety concerns

#### Step 6: Purchase Verification (Damage Claims)

**Purchase Date:**
- Date customer purchased product
- Used for warranty validation
- Default warranty: 90 days

**Purchase Source:**
- Authorized Dealer
- Direct from Store
- Third Party
- Other

**Receipt:**
- Upload if purchased from third party
- Required for non-authorized purchases

### Case Detail Page

#### Header Section

- **Case Number**: Unique identifier (e.g., CASE-05088)
- **Status Badge**: Current status with color coding
- **Priority Badge**: Low/Medium/High/Urgent
- **Case Type Badge**: Damage/Adjustment/SLA

**Action Buttons:**
- Back to Cases
- Edit Case
- Delete Case (with confirmation)
- Copy Case Number

#### Customer Information Card

**Displayed:**
- Recipient Name (inline editable)
- Recipient Email (inline editable)
- Recipient Phone (inline editable)
- Recipient Status Badge (Active/Inactive/On Hold)

**Inline Editing:**
- Hover over field to see edit icon
- Click to edit
- Press Enter or click checkmark to save
- Press Esc or click X to cancel
- Undo button appears for 10 seconds after save

#### Tracking Information Card

**Displayed:**
- Tracking ID (inline editable)
- Carrier Badge (FedEx/UPS/USPS)
- Service Type
- Ship Date
- Delivery Date

**Actions:**
- Click tracking number to copy
- Click carrier badge to filter by carrier
- "Capture Proof" button for screenshots

#### Financial Information Card

**Displayed:**
- Original Amount
- Adjusted Amount
- Claimed Amount (inline editable with $ prefix)
- Recovered Amount

**Calculations:**
- Open Exposure = Claimed - Recovered
- Recovery Rate = (Recovered / Claimed) × 100

#### Shipment Details Card

**Displayed:**
- Order Number (inline editable)
- Shipment Number (inline editable)
- Created Date
- Last Updated Date

#### Action Buttons

**Generate Form**
- Creates evidence package
- Auto-gathers all documents
- Generates cover letter with appendix
- Downloads as ZIP file
- Option to compile as PDF

**AI Review**
- Opens AI letter generation dialog
- Select tone: Professional, Firm, Escalated
- Pulls data from case, certifications, knowledge base
- Includes evidence references (Appendix A, B, C)
- Edit before downloading
- Download as TXT, PDF, or DOCX

**Verify Purchase** (Damage Claims)
- Checks purchase date against warranty period
- Cross-references WooCommerce orders
- Flags third-party purchases
- Requests receipt if needed
- Shows eligibility status

**File Insurance Claim**
- Opens insurance filing workflow
- Checks eligibility
- Supports dual-filing (insurance + carrier guarantee)
- Tracks claim numbers and status

### Cases List Page

#### Filters

**Status Filter** (Multi-select):
- Draft
- Filed / Processing
- Awaiting Response
- Resolved
- Closed
- Rejected
- Select multiple to combine

**Case Type Filter** (Multi-select):
- Damage Claims
- Adjustment Claims
- SLA Claims
- Select multiple to view combined

**Priority Filter**:
- All Priorities
- Low
- Medium
- High
- Urgent

**Carrier Filter**:
- All Carriers
- FedEx
- UPS
- USPS
- DHL
- Other

**Search**:
- Search by case number
- Search by tracking number
- Search by order number
- Search by customer name/email

#### Saved Search Presets

**Create Preset:**
1. Apply desired filters
2. Click "Save Search"
3. Name your preset
4. Preset appears in dropdown

**Use Preset:**
1. Click "Saved Searches" dropdown
2. Select preset
3. Filters auto-apply

**Manage Presets:**
- Edit preset name
- Delete preset
- Share preset (planned)

#### Pagination

**Items Per Page:**
- 25 (default)
- 50
- 100
- 250
- 500

**Navigation:**
- First Page button
- Previous Page button
- Page number display (e.g., "Page 1 of 5")
- Next Page button
- Last Page button

**Persistence:**
- Selection saved in browser
- Persists across sessions

#### Bulk Actions

**Select Cases:**
- Click checkbox on case cards
- "Select All" checkbox in header
- Shows count of selected cases

**Available Actions:**
- Update Status (change multiple cases at once)
- Update Priority
- Send Bulk Email
- Export to CSV
- Delete Cases (with confirmation)

**Undo:**
- Undo button appears for 5 minutes
- Click to revert bulk action
- Shows original values

#### Case Cards

**Compact View** (default):
- Case number, status, priority, type badges
- Customer name and email
- Tracking number and carrier
- Claimed amount
- Created date
- Quick action buttons

**Inline Editing on Cards:**
- Recipient name, email, phone
- Tracking number
- Order number, shipment number
- Claimed amount
- All editable without opening detail page

**Card Actions:**
- Click card to open detail
- Three-dot menu for more options:
  - Edit
  - Duplicate
  - Delete
  - Generate Form
  - AI Review

---

## Automation Features

### 1. ShipStation Auto-Sync

**What It Does:**
- Automatically syncs shipment data from ShipStation
- Runs daily at 2:00 AM
- Pulls tracking numbers, carrier info, delivery dates
- Updates existing cases with new shipment data

**How to Use:**
1. Configure ShipStation API keys in Settings → Secrets
2. Sync runs automatically every day
3. Manual sync: Go to Data → ShipStation Sync → "Sync Now"

**What Gets Synced:**
- Tracking numbers
- Carrier and service type
- Order numbers
- Customer names
- Ship dates and delivery dates
- Shipment status

**Troubleshooting:**
- Check API keys are correct
- Verify ShipStation account has API access
- Check sync logs for errors

### 2. Carrier Certification Lookup

**What It Does:**
- Auto-fetches delivery certifications from FedEx/UPS
- Provides proof of delivery
- Includes signature, delivery time, location

**How to Use:**
1. Enter tracking number in case
2. System automatically attempts lookup
3. Certification attached to case if found
4. View in Evidence Package

**Supported Carriers:**
- FedEx
- UPS
- (USPS planned)

### 3. 3PL Document Retrieval

**What It Does:**
- Pulls packing slips and invoices from 3PL systems
- Automates evidence gathering
- Reduces manual document hunting

**How to Use:**
1. Configure 3PL API credentials
2. System auto-fetches when order number provided
3. Documents attached to case automatically

### 4. WooCommerce Integration

**What It Does:**
- Syncs order data from WooCommerce store
- Pulls customer information
- Retrieves product details and pricing
- Used for purchase verification

**How to Use:**
1. Add WooCommerce credentials in Settings → Secrets
2. System auto-matches orders by order number
3. Purchase verification uses WooCommerce data

**What Gets Synced:**
- Order numbers and dates
- Customer names and emails
- Product SKUs and prices
- Order status

### 5. Evidence Package Auto-Builder

**What It Does:**
- Automatically gathers all evidence documents
- Creates organized ZIP package
- Generates cover letter with appendix index
- Renames files with proper naming convention

**How to Use:**
1. Open case detail page
2. Click "Generate Form" button
3. System gathers:
   - Carrier certification
   - ShipStation record
   - 3PL documents
   - Delivery photos
   - Invoice
   - Damage photos (if applicable)
4. Downloads ZIP file

**Package Contents:**
- Cover_Letter.pdf
- Appendix_A_Certification.pdf
- Appendix_B_ShipStation_Record.pdf
- Appendix_C_3PL_Documents.pdf
- Appendix_D_Photos.pdf
- Appendix_E_Invoice.pdf

**PDF Compilation Option:**
- Click "Compile as PDF" instead
- Merges all documents into single PDF
- Includes table of contents
- Easier to email or upload

### 6. AI Dispute Letter Writer

**What It Does:**
- Generates professional dispute letters using AI
- Pulls data from case, certifications, knowledge base
- Includes evidence references
- Multiple tone options

**How to Use:**
1. Open case detail page
2. Click "AI Review" button
3. Select tone:
   - **Professional**: Standard business tone
   - **Firm**: More assertive language
   - **Escalated**: Urgent, demanding tone
4. Review generated letter
5. Edit if needed
6. Download as TXT, PDF, or DOCX

**Letter Includes:**
- Case details (tracking, order number, dates)
- Damage description
- Financial amounts
- Evidence references (Appendix A, B, C)
- Carrier policy citations
- Request for resolution

**Tips:**
- Start with Professional tone
- Use Firm for second follow-up
- Use Escalated for final demand
- Always review before sending
- Save successful letters as templates

### 7. Bulk Email Sender

**What It Does:**
- Send emails to multiple cases at once
- Template variables auto-fill case data
- Track email status

**How to Use:**
1. Go to Cases page
2. Select cases (checkboxes)
3. Click "Bulk Actions" → "Send Email"
4. Choose email template or write custom
5. Use variables:
   - `{{caseNumber}}` - Case number
   - `{{recipientName}}` - Customer name
   - `{{trackingNumber}}` - Tracking ID
   - `{{claimedAmount}}` - Claimed amount
6. Preview emails
7. Click "Send"

**Email Templates:**
- Status Update
- Follow-up Request
- Resolution Notification
- Document Request
- Custom

**Tracking:**
- Sent timestamp recorded
- Delivery status tracked
- Open/click tracking (if SMTP supports)

### 8. Auto-Status Updates

**What It Does:**
- Monitors incoming emails from carriers
- Automatically updates case status based on email content
- Parses keywords and phrases
- Applies time-based rules

**How It Works:**
1. Email arrives from carrier
2. System parses content for keywords:
   - "approved" → Status: Resolved
   - "denied" → Status: Rejected
   - "pending" → Status: Awaiting Response
   - "requires additional information" → Status: Awaiting Response
3. Updates case status automatically
4. Logs status change with reason

**Time-Based Rules:**
- Draft for 7+ days → Reminder sent
- Awaiting Response for 30+ days → Status: Follow-up Needed
- Filed for 60+ days → Status: Escalation Required

**Configuration:**
- Edit keywords in Settings → Auto-Status Rules
- Adjust time thresholds
- Enable/disable specific rules

### 9. Smart Search & Filters

**What It Does:**
- Multi-select filtering by status, type, priority, carrier
- Saved search presets
- Real-time search
- Persistent filter state

**How to Use:**
1. Go to Cases page
2. Select filters from dropdowns
3. Combine multiple filters
4. Results update instantly
5. Save as preset for reuse

**Advanced Search:**
- Search by case number
- Search by tracking number
- Search by customer email
- Search by order number
- Full-text search (planned)

### 10. Inline Editing

**What It Does:**
- Edit case fields directly on case cards
- No need to open detail page
- Validation before saving
- Undo capability

**How to Use:**
1. Hover over editable field
2. Click edit icon that appears
3. Make changes
4. Press Enter or click checkmark to save
5. Press Esc or click X to cancel
6. Undo button appears for 10 seconds

**Editable Fields:**
- Recipient name, email, phone
- Tracking number
- Order number, shipment number
- Claimed amount
- Status (via dropdown)
- Priority (via dropdown)

**Validation:**
- Email format validation
- Phone number format validation
- Positive numbers for amounts
- Required field validation
- Error messages if invalid

### 11. Case Type System

**What It Does:**
- Classifies cases into three types
- Type-specific workflows
- Type-based filtering and reporting

**Case Types:**

**Damage Claims:**
- For shipments received damaged
- Requires damage documentation
- Photo evidence workflow
- Packaging assessment
- Insurance filing option

**Adjustment Claims:**
- For billing/pricing disputes
- Service level discrepancies
- Refund requests
- Overcharge disputes

**SLA Claims:**
- For delivery guarantee violations
- Late delivery disputes
- Service commitment breaches
- Carrier guarantee filing

**Type-Specific Fields:**
- Damage Claims: damage types, photos, packaging
- Adjustment Claims: original vs. adjusted amounts
- SLA Claims: guaranteed delivery date, actual delivery date

### 12. Follow-up Reminders

**What It Does:**
- Auto-creates reminders based on case rules
- Sends email notifications
- Tracks overdue reminders
- Recurring reminder support

**How It Works:**
1. Case created or status changed
2. System checks reminder rules
3. Auto-creates reminder if rule matches
4. Email sent at reminder time
5. Reminder marked complete when case updated

**Default Rules:**
- Draft case for 7 days → Reminder to file
- Awaiting Response for 14 days → Follow-up reminder
- Awaiting Response for 30 days → Escalation reminder

**Manual Reminders:**
1. Open case detail
2. Click "Add Reminder"
3. Set date/time
4. Add note
5. Choose recurring (daily/weekly/monthly)
6. Save

**Reminder Dashboard:**
- View all upcoming reminders
- See overdue reminders
- Mark complete manually
- Snooze reminder

### 13. Weekly Reports

**What It Does:**
- Auto-generates weekly performance reports
- Includes metrics, charts, top cases
- Sends via email with PDF attachment
- HTML email + PDF attachment

**Report Contents:**
- Summary metrics:
  - Total cases
  - New cases this week
  - Resolved cases this week
  - Total claimed amount
  - Total recovered amount
  - Success rate
- Carrier breakdown (cases and amounts per carrier)
- Status breakdown (count per status)
- Top 5 cases by claimed amount
- Monthly trends chart

**How to Use:**
1. Go to Reports → Weekly Report
2. Select date range (defaults to last week)
3. Click "Generate Report"
4. Preview in browser
5. Download PDF
6. Or click "Email Report" to send

**Scheduled Delivery:**
- Configure in Settings → Reports
- Choose recipients
- Select day of week
- Choose time
- Reports sent automatically

### 14. Webhook Integrations

**What It Does:**
- Receives data from external systems
- Auto-creates cases from Typeform submissions
- Imports from Google Sheets
- Triggers actions in Zapier/Make

**Supported Webhooks:**

**Typeform:**
- Endpoint: `POST /api/webhooks/typeform`
- Auto-creates case from form submission
- Maps form fields to case fields
- Sends confirmation email

**Google Sheets:**
- Endpoint: `POST /api/webhooks/google-sheets`
- Imports new rows as cases
- Duplicate detection
- Validation before import

**Zapier/Make:**
- Endpoint: `POST /api/webhooks/incoming`
- Generic webhook for any integration
- Flexible field mapping
- Event triggers (case.created, case.updated)

**Setup:**
1. Go to Settings → Webhooks
2. Copy webhook URL
3. Add to external system (Typeform, Zapier, etc.)
4. Configure field mapping
5. Test webhook
6. Enable

**Security:**
- Webhook signatures verified
- API key authentication
- Rate limiting
- IP whitelist (optional)

### 15. Letter Templates

**What It Does:**
- Stores successful letter patterns
- Tracks success rates
- Recommends templates based on case type
- Template library

**How to Use:**
1. Generate letter with AI
2. Edit as needed
3. Mark as successful when case resolves
4. System saves as template
5. Template available for similar cases

**Template Metadata:**
- Case type (Damage/Adjustment/SLA)
- Carrier
- Tone (Professional/Firm/Escalated)
- Success rate
- Usage count
- Tags

**Template Recommendation:**
- System suggests templates based on:
  - Case type match
  - Carrier match
  - Highest success rate
  - Most recent usage

**Managing Templates:**
- View all templates
- Edit template content
- Add tags
- Archive unused templates
- Export/import templates

### 16. Purchase Verification

**What It Does:**
- Verifies customer purchases
- Checks warranty eligibility
- Cross-references WooCommerce orders
- Flags third-party purchases

**How It Works:**
1. Customer submits damage claim
2. System checks purchase date
3. Calculates days since purchase
4. Compares to warranty period (default 90 days)
5. Checks purchase source
6. Requests receipt if needed

**Verification Status:**
- **Verified** - Purchase confirmed, within warranty
- **Pending** - Awaiting verification
- **Receipt Required** - Third-party purchase, need proof
- **Outside Warranty** - Purchase too old
- **Not Found** - Order not in system

**WooCommerce Cross-Check:**
- Searches orders by order number
- Matches customer email
- Pulls purchase date
- Confirms product SKU

**Warranty Periods:**
- Default: 90 days
- Custom per product (configurable)
- Grace period: 7 days (warnings only)

### 17. Insurance Filing

**What It Does:**
- Files insurance claims
- Files carrier guarantee claims
- Supports dual-filing (both at once)
- Tracks claim status separately

**Insurance Claims:**
1. Open case detail
2. Click "File Insurance Claim"
3. Enter insurance details:
   - Provider name
   - Policy number
   - Coverage amount
4. Upload documents
5. Add notes
6. Click "File"
7. System generates claim number
8. Tracks status

**Carrier Guarantee Claims:**
1. Open case detail
2. Click "File Carrier Guarantee"
3. System checks eligibility:
   - Service type must be guaranteed (Priority, Express, 2Day)
   - Tracking number required
   - Delivery date must violate guarantee
4. Upload documents
5. Add notes
6. Click "File"
7. System generates claim number

**Dual-Filing:**
- File both insurance and carrier guarantee
- Maximizes recovery chances
- Tracks both claim numbers
- Updates both statuses independently

**Eligibility Checking:**
- Insurance: Checks policy coverage, claim amount
- Carrier Guarantee: Checks service type, delivery date
- Warnings for potential issues
- Recommendations for best approach

### 18. Damage Documentation

**What It Does:**
- Structured workflow for documenting damage
- Photo checklist
- Completion tracking
- Evidence organization

**Photo Checklist:**
- [ ] Photo of damaged tube
- [ ] Photo of damaged rod (if visible)
- [ ] Photo of broken tip
- [ ] Photo of bent eye
- [ ] Photo of structural damage
- [ ] Photo of packaging

**How to Use:**
1. Open damage claim case
2. Go to "Damage Documentation" section
3. Upload photos for each item
4. Check off completed items
5. Add damage description
6. Note packaging condition
7. Save

**Completion Indicator:**
- Shows percentage complete (e.g., "4/6 photos uploaded - 67%")
- Highlights missing items
- Required before filing claim

**Organization:**
- Photos auto-named by type
- Included in evidence package
- Referenced in dispute letter

### 19. Google Sheets Import

**What It Does:**
- Imports damage claims from Google Sheets
- OAuth authentication
- Duplicate detection
- Bulk import

**Setup:**
1. Go to Settings → Integrations → Google Sheets
2. Click "Connect Google Account"
3. Authorize access
4. Select spreadsheet
5. Map columns to fields
6. Save configuration

**Import Process:**
1. Go to Data → Google Sheets Import
2. Select spreadsheet
3. Preview data
4. Click "Import"
5. System creates cases
6. Shows import results (success/failed counts)

**Column Mapping:**
- Timestamp → Created Date
- Customer Name → Recipient Name
- Customer Email → Recipient Email
- Order Number → Order Number
- Tracking Number → Tracking ID
- Damage Type → Damage Types
- Damage Description → Damage Description
- Photos → Photo URLs

**Duplicate Detection:**
- Checks order number + email
- Skips if case already exists
- Logs skipped rows

### 20. Bulk Actions

**What It Does:**
- Update multiple cases at once
- Undo capability
- Confirmation dialogs
- Progress tracking

**Available Actions:**
- **Update Status** - Change status for selected cases
- **Update Priority** - Change priority for selected cases
- **Send Email** - Send bulk email to selected cases
- **Export CSV** - Export selected cases to CSV
- **Delete** - Delete selected cases (with confirmation)

**How to Use:**
1. Go to Cases page
2. Select cases (checkboxes)
3. Click "Bulk Actions" dropdown
4. Choose action
5. Configure action (e.g., new status)
6. Confirm
7. Action applied
8. Undo button appears for 5 minutes

**Undo:**
- Click "Undo" button
- System reverts changes
- Original values restored
- Works for all bulk actions except delete

**Confirmation Dialogs:**
- Shows count of selected cases
- Previews action
- Warns if action is destructive
- Requires explicit confirmation

### 21. Pagination & Display

**What It Does:**
- Controls how many cases shown per page
- Navigation between pages
- Persistent preferences

**Items Per Page Options:**
- 25 (default)
- 50
- 100
- 250
- 500

**Navigation:**
- First Page (|<)
- Previous Page (<)
- Current Page Display (e.g., "Page 2 of 10")
- Next Page (>)
- Last Page (>|)

**Persistence:**
- Selection saved in browser localStorage
- Persists across sessions
- Per-user preference

**Performance:**
- Only loads current page data
- Lazy loading for large datasets
- Prevents UI lag with 1000+ cases

---

## Document Generation

### Dispute Letters

**Generation Process:**
1. Open case detail
2. Click "AI Review"
3. Select tone
4. AI generates letter with:
   - Case details
   - Damage description
   - Evidence references
   - Financial amounts
   - Resolution request
5. Review and edit
6. Download

**Tone Options:**

**Professional:**
- Standard business language
- Polite but firm
- Suitable for first contact
- Example: "We respectfully request..."

**Firm:**
- More assertive language
- Direct statements
- For follow-ups
- Example: "We expect immediate resolution..."

**Escalated:**
- Urgent, demanding tone
- Mentions escalation
- For final demands
- Example: "This is our final request before..."

**Edit Interface:**
- Full text editor
- Word/character count
- Preview tab
- Reset to original
- Download options:
  - TXT (plain text)
  - PDF (formatted)
  - DOCX (editable Word document)

### Evidence Packages

**ZIP Package Contents:**
1. **Cover_Letter.pdf**
   - Generated cover letter
   - Lists all appendices
   - Case summary

2. **Appendix_A_Certification.pdf**
   - Carrier delivery certification
   - Proof of delivery
   - Signature and timestamp

3. **Appendix_B_ShipStation_Record.pdf**
   - Shipment details from ShipStation
   - Tracking history
   - Service type

4. **Appendix_C_3PL_Documents.pdf**
   - Packing slip
   - Invoice
   - Product details

5. **Appendix_D_Photos.pdf**
   - All damage photos
   - Packaging photos
   - Organized by type

6. **Appendix_E_Invoice.pdf**
   - Original invoice
   - Pricing breakdown
   - Order details

**PDF Compilation:**
- Alternative to ZIP
- Merges all documents into single PDF
- Includes table of contents
- Page numbers
- Bookmarks for navigation
- Easier to email or upload to carrier portals

**Generation:**
1. Click "Generate Form"
2. System gathers all documents
3. Creates cover letter
4. Renames files
5. Packages into ZIP or compiles PDF
6. Downloads automatically

### Weekly Reports

**Report Format:**
- HTML email body
- PDF attachment
- Charts and graphs
- Professional styling

**Sections:**

**1. Executive Summary**
- Total cases
- New cases this week
- Resolved cases this week
- Success rate

**2. Financial Metrics**
- Total claimed
- Total recovered
- Open exposure
- Recovery rate

**3. Carrier Breakdown**
- Table showing:
  - Carrier name
  - Number of cases
  - Total claimed
  - Total recovered
- Sorted by case count

**4. Status Breakdown**
- Table showing:
  - Status name
  - Case count
- Pie chart visualization

**5. Top Cases**
- Top 5 cases by claimed amount
- Shows:
  - Case number
  - Carrier
  - Claimed amount
  - Status

**6. Monthly Trends**
- Line chart showing:
  - Cases filed per month (last 6 months)
  - Amount recovered per month
- Trend analysis

**Generation:**
- Manual: Reports → Generate Weekly Report
- Scheduled: Settings → Reports → Schedule
- Email delivery with PDF attachment
- HTML email for quick viewing

---

## Integrations

### ShipStation

**What It Syncs:**
- Shipment data
- Tracking numbers
- Carrier information
- Order numbers
- Customer names
- Ship dates
- Delivery dates
- Shipment status

**Setup:**
1. Get ShipStation API credentials:
   - Login to ShipStation
   - Go to Settings → API Settings
   - Generate API Key and Secret
   - Copy API V2 Key
2. Add to system:
   - Settings → Secrets
   - Add `SHIPSTATION_API_KEY`
   - Add `SHIPSTATION_API_SECRET`
   - Add `SHIPSTATION_API_V2_KEY`
3. Test connection:
   - Data → ShipStation Sync
   - Click "Test Connection"
   - Should show "Connected"

**Sync Schedule:**
- Automatic: Daily at 2:00 AM
- Manual: Data → ShipStation Sync → "Sync Now"
- Duration: Depends on shipment count (typically 1-5 minutes)

**Sync Process:**
1. Fetches all shipments from last 30 days
2. Matches with existing cases by tracking number
3. Updates case data if match found
4. Creates shipment data records
5. Logs sync results

**Troubleshooting:**
- **"Authentication Failed"**: Check API credentials
- **"No Data"**: Verify date range, check ShipStation has shipments
- **"Timeout"**: Large dataset, try manual sync in smaller date ranges

### WooCommerce

**What It Syncs:**
- Order data
- Customer information
- Product details
- Pricing
- Order status
- Purchase dates

**Setup:**
1. Get WooCommerce API credentials:
   - Login to WordPress admin
   - WooCommerce → Settings → Advanced → REST API
   - Add Key
   - Set permissions to "Read"
   - Copy Consumer Key and Secret
2. Add to system:
   - Settings → Secrets
   - Add `WOOCOMMERCE_STORE_URL` (e.g., https://yourstore.com)
   - Add `WOOCOMMERCE_CONSUMER_KEY`
   - Add `WOOCOMMERCE_CONSUMER_SECRET`
3. Test connection:
   - Data → WooCommerce Sync
   - Click "Test Connection"

**Usage:**
- Purchase verification auto-queries WooCommerce
- Searches by order number
- Matches customer email
- Pulls purchase date and product details
- Used for warranty validation

**Troubleshooting:**
- **"Store Not Found"**: Check `WOOCOMMERCE_STORE_URL` is correct
- **"Authentication Failed"**: Verify Consumer Key and Secret
- **"Order Not Found"**: Order may not exist in WooCommerce, check order number

### Google Sheets

**What It Does:**
- Imports damage claims from Google Sheets
- OAuth authentication
- Reads form responses (Typeform, Google Forms)
- Bulk import

**Setup:**
1. Go to Settings → Integrations → Google Sheets
2. Click "Connect Google Account"
3. Sign in with Google
4. Grant permissions:
   - Read spreadsheets
   - Read Drive files
5. Authorization complete

**Import:**
1. Data → Google Sheets Import
2. Click "Select Spreadsheet"
3. Choose from your Google Drive
4. Select sheet tab (e.g., "Form Responses 1")
5. Preview data
6. Map columns:
   - Email → Recipient Email
   - Name → Recipient Name
   - Order Number → Order Number
   - etc.
7. Click "Import"
8. Review results

**Expected Sheet Format:**
- First row: Headers
- Subsequent rows: Data
- Common headers:
  - Timestamp
  - Email / Customer Email
  - Name / Customer Name
  - Order Number
  - Tracking Number
  - Damage Type
  - Damage Description
  - Photos (URLs separated by semicolons)

**Duplicate Handling:**
- System checks order number + email
- Skips if case already exists
- Logs skipped rows in import results

### Typeform

**What It Does:**
- Receives form submissions via webhook
- Auto-creates cases from customer damage reports
- Real-time import

**Setup:**
1. Create Typeform for damage claims
2. Go to Settings → Webhooks in system
3. Copy Typeform webhook URL
4. In Typeform:
   - Connect → Webhooks
   - Add webhook
   - Paste URL
   - Save
5. Test by submitting form

**Form Fields (Recommended):**
- Email (required)
- Name
- Order Number (required)
- Tracking Number
- Damage Type (multiple choice: Tube, Rod, Tip, Eye, Structural)
- Damage Description (long text)
- Photos (file upload)
- Purchase Date

**Webhook Process:**
1. Customer submits Typeform
2. Typeform sends webhook to system
3. System validates data
4. Creates new case
5. Sends confirmation email to customer

**Troubleshooting:**
- **"Webhook Failed"**: Check webhook URL is correct
- **"Missing Required Fields"**: Ensure form has email and order number
- **"Case Not Created"**: Check webhook logs in Settings → Webhooks

### Zapier / Make.com

**What It Does:**
- Connects to 1000+ apps
- Trigger actions when cases created/updated
- Import data from other systems

**Setup:**
1. Go to Settings → Webhooks
2. Copy "Incoming Webhook URL"
3. In Zapier/Make:
   - Create new Zap/Scenario
   - Trigger: Webhook
   - Paste URL
   - Configure field mapping
4. Test webhook

**Outgoing Webhooks:**
- System sends webhooks when:
  - Case created
  - Case updated
  - Case resolved
  - Status changed
- Configure in Settings → Webhooks → Outgoing

**Example Zaps:**
- Slack notification when case created
- Add row to Google Sheets when case resolved
- Send SMS via Twilio when status changes
- Create Trello card for new case

---

## Settings & Configuration

### Secrets Management

**Location:** Settings → Secrets

**Required Secrets:**
- `SHIPSTATION_API_KEY`
- `SHIPSTATION_API_SECRET`
- `SHIPSTATION_API_V2_KEY`
- `WOOCOMMERCE_STORE_URL`
- `WOOCOMMERCE_CONSUMER_KEY`
- `WOOCOMMERCE_CONSUMER_SECRET`
- `OPENAI_API_KEY`
- `JWT_SECRET`

**SMTP Configuration:**
- `SMTP_HOST` (e.g., smtp.gmail.com)
- `SMTP_PORT` (e.g., 587)
- `SMTP_USER` (email address)
- `SMTP_PASS` (email password or app password)
- `SMTP_FROM` (sender email address)

**Adding Secrets:**
1. Go to Settings → Secrets
2. Click "Add Secret"
3. Enter key name (e.g., `OPENAI_API_KEY`)
4. Enter value
5. Click "Save"
6. Secret encrypted and stored

**Editing Secrets:**
1. Find secret in list
2. Click "Edit"
3. Enter new value
4. Click "Save"

**Deleting Secrets:**
1. Find secret in list
2. Click "Delete"
3. Confirm deletion
4. Secret removed

**Security:**
- Secrets encrypted at rest
- Not visible in logs
- Access restricted to admin users
- Audit trail of changes

### Webhook Configuration

**Location:** Settings → Webhooks

**Incoming Webhooks:**
- Typeform: `/api/webhooks/typeform`
- Google Sheets: `/api/webhooks/google-sheets`
- Generic: `/api/webhooks/incoming`

**Outgoing Webhooks:**
1. Click "Add Outgoing Webhook"
2. Enter URL
3. Select events:
   - case.created
   - case.updated
   - case.resolved
   - status.changed
4. Add authentication (optional):
   - API key
   - Bearer token
   - Custom headers
5. Save

**Testing:**
- Click "Test" button
- System sends test payload
- Shows response
- Logs result

**Webhook Logs:**
- View all webhook activity
- See payloads
- Check responses
- Debug failures

### Email Templates

**Location:** Settings → Email Templates

**Default Templates:**
- Status Update
- Follow-up Request
- Resolution Notification
- Document Request

**Creating Template:**
1. Click "New Template"
2. Enter name
3. Write subject line
4. Write email body
5. Use variables:
   - `{{caseNumber}}`
   - `{{recipientName}}`
   - `{{trackingNumber}}`
   - `{{status}}`
   - `{{claimedAmount}}`
6. Preview
7. Save

**Editing Template:**
1. Find template in list
2. Click "Edit"
3. Make changes
4. Preview
5. Save

**Variables:**
- `{{caseNumber}}` - Case number
- `{{recipientName}}` - Customer name
- `{{recipientEmail}}` - Customer email
- `{{trackingNumber}}` - Tracking ID
- `{{carrier}}` - Carrier name
- `{{status}}` - Current status
- `{{priority}}` - Priority level
- `{{claimedAmount}}` - Claimed amount (formatted)
- `{{recoveredAmount}}` - Recovered amount (formatted)
- `{{orderNumber}}` - Order number

### Auto-Status Rules

**Location:** Settings → Auto-Status Rules

**Keyword Rules:**
- Add keywords that trigger status changes
- Example: "approved" → Status: Resolved

**Creating Rule:**
1. Click "Add Rule"
2. Enter keyword or phrase
3. Select new status
4. Set confidence threshold (0-100%)
5. Save

**Time-Based Rules:**
- Draft for X days → Action
- Awaiting Response for X days → Action
- Filed for X days → Action

**Editing Rule:**
1. Find rule in list
2. Click "Edit"
3. Modify settings
4. Save

**Disabling Rule:**
1. Find rule in list
2. Toggle "Enabled" switch
3. Rule no longer applies

### Report Scheduling

**Location:** Settings → Reports

**Weekly Report Schedule:**
1. Enable "Auto-send Weekly Reports"
2. Select day of week (e.g., Monday)
3. Select time (e.g., 9:00 AM)
4. Add recipients (email addresses)
5. Save

**Report Preferences:**
- Include charts: Yes/No
- Include top cases: Yes/No
- Number of top cases: 5/10/20
- Date range: Last 7 days / Last 30 days / Custom

### User Profile

**Location:** Click user avatar → Profile

**Editable:**
- Name
- Email
- Phone
- Timezone
- Language (planned)

**Password Change:**
1. Click "Change Password"
2. Enter current password
3. Enter new password
4. Confirm new password
5. Save

**Preferences:**
- Default items per page
- Email notifications
- Desktop notifications
- Theme (Light/Dark)

---

## Advanced Features

### API Access

**Base URL:** `https://your-domain.com/api`

**Authentication:**
- JWT token required
- Include in header: `Authorization: Bearer <token>`

**Endpoints:**

**Cases:**
- `GET /api/cases` - List all cases
- `GET /api/cases/:id` - Get case by ID
- `POST /api/cases` - Create case
- `PUT /api/cases/:id` - Update case
- `DELETE /api/cases/:id` - Delete case

**Documents:**
- `POST /api/documents/generateDisputeLetter` - Generate letter
- `POST /api/documents/buildEvidencePackage` - Build package
- `POST /api/documents/compileEvidencePDF` - Compile PDF

**Webhooks:**
- `POST /api/webhooks/typeform` - Typeform webhook
- `POST /api/webhooks/google-sheets` - Google Sheets webhook
- `POST /api/webhooks/incoming` - Generic webhook

**Full API documentation:** See API.md

### Workflow Automation

**Custom Workflows (Planned):**
- Visual workflow builder
- Drag-and-drop actions
- Conditional logic
- Scheduled execution

**Example Workflows:**
- Auto-file claims when damage documented
- Auto-send follow-up after 14 days
- Auto-escalate if no response in 30 days
- Auto-close resolved cases after 7 days

### Team Collaboration (Planned)

**Features:**
- Assign cases to team members
- Internal notes and comments
- Activity timeline
- @mentions
- Role-based permissions

**Roles:**
- Admin - Full access
- Manager - View and edit all cases
- Agent - View and edit assigned cases
- Viewer - Read-only access

### Analytics Dashboard (Planned)

**Metrics:**
- Cases by carrier (chart)
- Success rate trends (line chart)
- Average resolution time
- Recovery rate by case type
- Agent performance

**Filters:**
- Date range
- Carrier
- Case type
- Status
- Priority

**Export:**
- Download as PDF
- Download as CSV
- Schedule email delivery

---

## Troubleshooting

### Common Issues

**Issue: Cases not syncing from ShipStation**

**Solution:**
1. Check API credentials in Settings → Secrets
2. Verify ShipStation account has API access enabled
3. Check sync logs for errors
4. Try manual sync with smaller date range
5. Contact ShipStation support if issue persists

---

**Issue: AI letter generation fails**

**Solution:**
1. Check OpenAI API key in Settings → Secrets
2. Verify API key has credits
3. Check case has required data (tracking, carrier, amounts)
4. Try again in a few minutes (rate limiting)
5. Check error message for details

---

**Issue: Emails not sending**

**Solution:**
1. Check SMTP credentials in Settings → Secrets
2. Verify SMTP server allows connections
3. Check spam folder
4. Test SMTP connection in Settings → Email
5. Try different SMTP port (587 or 465)
6. Enable "Less secure apps" if using Gmail
7. Use app password if 2FA enabled

---

**Issue: Inline editing not saving**

**Solution:**
1. Check validation errors (red text)
2. Ensure required fields not empty
3. Check number formats (positive numbers only)
4. Check email format
5. Try refreshing page
6. Check browser console for errors

---

**Issue: Pagination not working**

**Solution:**
1. Clear browser cache
2. Check localStorage not full
3. Try different items per page
4. Refresh page
5. Check browser console for errors

---

**Issue: Webhook not receiving data**

**Solution:**
1. Check webhook URL is correct
2. Verify webhook enabled in external system
3. Check webhook logs in Settings → Webhooks
4. Test webhook with manual trigger
5. Check firewall not blocking
6. Verify payload format matches expected

---

**Issue: Purchase verification failing**

**Solution:**
1. Check WooCommerce credentials
2. Verify order exists in WooCommerce
3. Check order number matches exactly
4. Verify customer email matches
5. Check WooCommerce API permissions (should be "Read")

---

**Issue: Google Sheets import failing**

**Solution:**
1. Re-authorize Google account
2. Check spreadsheet permissions (must be accessible)
3. Verify sheet name is correct
4. Check column headers match expected format
5. Ensure required columns present (email, order number)

---

### Performance Issues

**Issue: Slow loading with many cases**

**Solution:**
1. Use pagination (reduce items per page)
2. Apply filters to reduce dataset
3. Use search instead of scrolling
4. Clear browser cache
5. Check database indexes (admin)

---

**Issue: Evidence package generation slow**

**Solution:**
1. Check document sizes (large PDFs/images slow)
2. Compress images before upload
3. Reduce number of documents
4. Try PDF compilation instead of ZIP
5. Check server resources (admin)

---

### Data Issues

**Issue: Duplicate cases**

**Solution:**
1. Delete duplicate manually
2. Enable duplicate detection in imports
3. Check order number + email combination
4. Review import logs

---

**Issue: Missing data in case**

**Solution:**
1. Check if data exists in source system (ShipStation, WooCommerce)
2. Re-sync from source
3. Manually add missing data
4. Check field mapping in import

---

**Issue: Incorrect amounts**

**Solution:**
1. Check currency format (cents vs. dollars)
2. Verify calculation logic
3. Check source data
4. Manually correct if needed

---

### Getting Help

**Documentation:**
- README.md - Overview and setup
- WIKI.md - This document
- API.md - API documentation
- DEVELOPER.md - Technical docs

**Support:**
- Email: herve@catchthefever.com
- Check logs in Settings → System Logs
- Export error logs for support team

**Reporting Bugs:**
1. Note exact steps to reproduce
2. Include error message
3. Check browser console
4. Export system logs
5. Email to support with details

---

## Appendix

### Keyboard Shortcuts

- `Ctrl/Cmd + K` - Quick search
- `Ctrl/Cmd + N` - New case
- `Ctrl/Cmd + S` - Save (in edit mode)
- `Esc` - Cancel edit / Close dialog
- `Enter` - Save inline edit
- `Ctrl/Cmd + /` - Toggle sidebar

### Status Definitions

- **Draft** - Case being prepared, not yet filed
- **Filed** - Submitted to carrier
- **Awaiting Response** - Waiting for carrier reply
- **Resolved** - Successfully closed with recovery
- **Closed** - Closed without recovery
- **Rejected** - Denied by carrier

### Priority Definitions

- **Low** - Non-urgent, low value
- **Medium** - Standard priority
- **High** - Important, higher value
- **Urgent** - Immediate attention required

### Case Type Definitions

- **Damage Claims** - Shipments received damaged
- **Adjustment Claims** - Billing/pricing disputes
- **SLA Claims** - Delivery guarantee violations

### Carrier Codes

- **FEDEX** - FedEx
- **UPS** - United Parcel Service
- **USPS** - United States Postal Service
- **DHL** - DHL Express
- **OTHER** - Other carriers

### Glossary

- **3PL** - Third-Party Logistics provider
- **SLA** - Service Level Agreement
- **SKU** - Stock Keeping Unit
- **OAuth** - Open Authorization
- **tRPC** - TypeScript Remote Procedure Call
- **JWT** - JSON Web Token
- **SMTP** - Simple Mail Transfer Protocol
- **API** - Application Programming Interface
- **CSV** - Comma-Separated Values
- **PDF** - Portable Document Format
- **ZIP** - Compressed archive format

---

**Last Updated:** October 30, 2025  
**Version:** 1.0.0  
**Maintained by:** Catch The Fever Team
