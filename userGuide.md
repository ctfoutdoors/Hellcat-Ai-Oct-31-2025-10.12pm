# Carrier Dispute System - User Guide

## Purpose
Comprehensive carrier dispute management system for tracking, documenting, and resolving shipping overcharges, delivery guarantee violations, and carrier billing discrepancies.

## Access
- **Login**: Google OAuth authentication
- **Admin**: herve@catchthefever.com
- **Role-based access**: Admin can manage all features, add additional users

## Powered by Manus

**Technology Stack:**
- **Frontend**: React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui components
- **Backend**: Node.js + Express 4 + tRPC 11 for type-safe APIs
- **Database**: MySQL/TiDB with Drizzle ORM (22 tables)
- **AI**: OpenAI GPT-4o with function calling and vision capabilities
- **Integrations**: ShipStation, WooCommerce, Zoho Desk, Gmail, Google Sheets
- **Storage**: AWS S3 for documents, images, and audio files
- **Authentication**: Manus OAuth with Google
- **Deployment**: Auto-scaling infrastructure with global CDN

## Using Your Website

### Dashboard
View real-time financial metrics including "Total Claimed", "Total Recovered", "Open Exposure", and "Success Rate". Interactive charts display case status distribution and top carriers by claim volume.

### Case Management
Click "Cases" to view all disputes. Use "Create Case" button to file new disputes with tracking number, carrier selection, and claimed amounts. Search cases by tracking ID or filter by status. Click any case to view full details including evidence photos, voice memos, activity timeline, and generated dispute letters.

### AI Assistant
Click the blue bot icon in bottom-right corner to chat with your AI assistant. Upload images for automatic data extraction, record voice memos for transcription, or ask questions about carrier policies. AI can create cases, analyze shipments, and suggest claim amounts with confidence scoring.

### Order Monitoring
View all ShipStation orders with real-time sync. Filter by status or date range. System tracks orders from multiple channels (WooCommerce, eBay, Amazon, manual orders) with complete product and shipping information.

### Mass Import
Click "Import Cases" to upload CSV or Excel files with multiple disputes. Download the template, fill in tracking numbers and amounts, then drag-and-drop to import. System validates data and shows preview before creating cases in bulk.

### Products & Certifications
Sync product catalog from WooCommerce with "Sync from WooCommerce" button. Manage rod tube certifications with PDF/image uploads, size specifications, and expiry tracking. System alerts when certifications are expiring soon.

### Shipment Audits
Click "Run Audit" to automatically detect overcharges and undercharges by comparing quoted vs actual shipping rates. Create cases directly from audit results with one click.

### Document Generation
In any case detail page, click "Generate Dispute Letter" to create professional carrier dispute letters with automatic data population, evidence appendixes, and electronic timestamps. Documents upload to S3 and link to cases.

### Email Management
Configure multiple email accounts in "Settings" → "Email Accounts". Add SMTP credentials for Zoho, Gmail, or custom domains. Send dispute letters directly from cases with attachment support and activity logging.

## Managing Your Website

### Settings
Access "Settings" to configure integrations:
- **Credentials Vault**: Securely store API keys for ShipStation, WooCommerce, Zoho Desk, OpenAI, and Google services
- **Email Accounts**: Add SMTP accounts for sending dispute correspondence
- **Test Connections**: Verify all API credentials are working correctly

### Database
Use Management UI → Database panel to view and edit all data tables. Full CRUD operations available with connection info in settings (enable SSL for production).

### Code & Deployment
Download all project files via Management UI → Code panel. View live preview in Preview panel. Click "Publish" button to deploy to production at your custom domain.

## Next Steps
Talk to Manus AI anytime to request changes or add features. The system continuously learns from your cases to improve suggestions and automation. Start by creating your first case or importing existing disputes to build your knowledge base.

### Production Readiness
Before going live, update these API keys in Settings → Secrets:
- **OpenAI**: Currently using project key (update for production usage limits)
- **WooCommerce**: Configured for catchthefever.com
- **ShipStation**: Add your account credentials
- **Zoho Desk**: Add OAuth token for Org ID 904259723

Get production keys from service websites before processing live disputes.
