# Catch The Fever - Carrier Dispute System

A comprehensive automation platform for managing shipping carrier disputes, damage claims, and insurance filing workflows.

## 🚀 Features

### Core Automation (21 Features)
1. **ShipStation Auto-Sync** - Daily sync at 2 AM, pulls shipment data automatically
2. **Carrier Certification Lookup** - Auto-fetches FedEx/UPS certifications with tracking numbers
3. **3PL Document Retrieval** - Pulls packing slips, invoices from 3PL systems
4. **WooCommerce Integration** - Syncs order data, customer info, product details
5. **Evidence Package Auto-Builder** - Generates ZIP packages with all documents
6. **AI Dispute Letter Writer** - Creates professional letters with evidence references
7. **Bulk Email Sender** - Send updates to multiple cases with template variables
8. **Auto-Status Updates** - Email monitoring updates case status automatically
9. **Smart Search & Filters** - Multi-select status/type filtering with saved presets
10. **Inline Editing** - Edit case fields directly with validation and undo
11. **Case Type System** - Damage Claims, Adjustment Claims, SLA Claims
12. **Follow-up Reminders** - Auto-create reminders with email notifications
13. **Weekly Reports** - Auto-generate PDF/HTML reports with metrics
14. **Webhook Integrations** - Typeform, Google Sheets, Zapier, Make.com
15. **Letter Templates** - Store successful patterns with success rate tracking
16. **Purchase Verification** - WooCommerce cross-check, warranty validation
17. **Insurance Filing** - Dual-track filing (insurance + carrier guarantee)
18. **Damage Documentation** - Photo checklist workflow for damage claims
19. **Google Sheets Import** - OAuth import for customer damage submissions
20. **Bulk Actions** - Update multiple cases with undo capability
21. **Pagination & Display** - View 25/50/100/250/500 cases per page

### Case Management
- **57-field database schema** supporting comprehensive case data
- **Case types**: Damage Claims, Adjustment Claims, SLA Claims
- **Status tracking**: Draft, Filed, Awaiting Response, Resolved, Closed, Rejected
- **Priority levels**: Low, Medium, High, Urgent
- **Recipient status**: Active, Inactive, On Hold

### Document Generation
- **Word documents** (.docx) - Dispute letters, forms
- **PDF compilation** - Merge all evidence into single PDF
- **Evidence packages** - Auto-generated ZIP with cover letter
- **Weekly reports** - HTML + PDF with charts and metrics

### Integrations
- **ShipStation** - Shipment data sync
- **WooCommerce** - Order and customer data
- **FedEx/UPS** - Certification lookup
- **Google Sheets** - OAuth import for damage claims
- **Typeform** - Webhook for customer submissions
- **Zapier/Make** - Webhook triggers for automation

## 📋 Prerequisites

- Node.js 22.x
- PostgreSQL database
- SMTP server for emails
- API keys for:
  - ShipStation
  - WooCommerce
  - OpenAI (for AI letter generation)
  - Google Sheets (optional, for imports)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd carrier-dispute-system
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   
   Required secrets (configure in Settings → Secrets):
   - `SHIPSTATION_API_KEY`
   - `SHIPSTATION_API_SECRET`
   - `SHIPSTATION_API_V2_KEY`
   - `WOOCOMMERCE_STORE_URL`
   - `WOOCOMMERCE_CONSUMER_KEY`
   - `WOOCOMMERCE_CONSUMER_SECRET`
   - `OPENAI_API_KEY`
   - `JWT_SECRET`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`

4. **Initialize database**
   ```bash
   pnpm db:push
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

6. **Access the application**
   - Open browser to `http://localhost:3000`
   - Login with your credentials

## 📚 Documentation

- **[User Guide](./userGuide.md)** - Complete guide for end users
- **[Wiki](./WIKI.md)** - Detailed feature documentation
- **[Developer Guide](./DEVELOPER.md)** - Technical documentation
- **[API Documentation](./API.md)** - Integration endpoints

## 🔧 Configuration

### Daily Sync Schedule
The system automatically syncs ShipStation data daily at 2:00 AM. To modify:
```typescript
// server/services/syncScheduler.ts
const SYNC_SCHEDULE = '0 2 * * *'; // Cron format
```

### Email Monitoring
Configure email monitoring rules in:
```typescript
// server/services/emailMonitoringService.ts
```

### Webhook Endpoints
- Typeform: `POST /api/webhooks/typeform`
- Google Sheets: `POST /api/webhooks/google-sheets`
- Generic: `POST /api/webhooks/incoming`

## 🎯 Quick Start

### Creating a Case
1. Click "+ New Case" in header
2. Select case type (Damage/Adjustment/SLA)
3. Fill in customer and shipment details
4. Add damage documentation if applicable
5. Click "Create Case"

### Generating Dispute Letter
1. Open case detail page
2. Click "AI Review" button
3. Select tone (Professional/Firm/Escalated)
4. Review and edit generated letter
5. Download as TXT/PDF/DOCX

### Building Evidence Package
1. Open case detail page
2. Click "Generate Form" button
3. System auto-gathers all documents
4. Download ZIP or PDF compilation

### Bulk Operations
1. Go to Cases page
2. Select multiple cases (checkboxes)
3. Choose bulk action (Update Status, Send Email, etc.)
4. Confirm action
5. Undo available for 5 minutes

## 📊 Database Schema

The system uses a 57-field schema supporting:
- Customer information (name, email, phone, address)
- Shipment details (tracking, carrier, service type)
- Financial data (claimed amount, recovered amount, costs)
- Damage documentation (types, photos, descriptions)
- Purchase verification (date, source, warranty status)
- Insurance claims (provider, policy, claim numbers)
- Carrier guarantees (claim numbers, status)
- Timestamps and audit trail

## 🔐 Security

- JWT-based authentication
- OAuth integration for Google Sheets
- Webhook signature verification
- Environment variable encryption
- Role-based access control (planned)

## 🧪 Testing

Run the test suite:
```bash
pnpm test
```

Test coverage includes:
- Unit tests for services
- Integration tests for API endpoints
- E2E tests for critical workflows

## 📈 Performance

- Handles 1000+ cases efficiently
- Pagination prevents UI lag
- Database indexes on key fields
- Lazy loading for large datasets

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## 📝 License

Proprietary - Catch The Fever LLC

## 🆘 Support

For issues or questions:
- Email: herve@catchthefever.com
- Internal documentation: See WIKI.md

## 🗺️ Roadmap

See `todo.md` for planned features:
- Mobile app
- SMS notifications
- Calendar integration
- Advanced analytics
- Team collaboration features
- API access for third parties

## 📦 Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Node.js, tRPC, Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with OAuth support
- **Document Generation**: docx, pdf-lib, PDFDocument
- **Email**: Nodemailer with SMTP
- **Scheduling**: node-cron
- **Integrations**: Axios for API calls

## 🔄 Version History

- **v1.0.0** - Initial release with 21 automation features
- Database: 57 fields supporting comprehensive workflows
- Integrations: ShipStation, WooCommerce, Google Sheets, Typeform
- Document generation: Word, PDF, ZIP packages
- AI-powered letter generation with templates

---

Built with ❤️ by Catch The Fever team
