# Hellcat Intelligence Platform - Deployment Guide

**Version:** November 25, 2025  
**Repository:** ctfoutdoors/Hellcat-Ai-Oct-31-2025-10.12pm  
**Branch:** snapshot-2025-11-25

---

## Quick Start for New Agent

This guide enables another AI agent or developer to quickly restore and continue work on the Hellcat Intelligence Platform from a new sandbox environment.

---

## Method 1: Using Manus Webdev System (Recommended for AI Agents)

### Prerequisites
- Access to Manus platform
- Webdev tools available

### Step 1: Restore from Checkpoint
```javascript
webdev_rollback_checkpoint({
  brief: "Load hellcat-intelligence project",
  version_id: "10f8b112"
})
```

This command will:
- Restore complete project to /home/ubuntu/hellcat-intelligence
- Load all environment variables and secrets
- Initialize database connection
- Set up webdev project context

### Step 2: Verify Project Status
```javascript
webdev_check_status({
  brief: "Verify project loaded correctly"
})
```

Expected output:
- Project name: hellcat-intelligence
- Dev server status: running or stopped
- Database connection: configured
- Current version: 10f8b112

### Step 3: Start Development Server
```javascript
webdev_restart_server({
  brief: "Start development server"
})
```

Server will be available at port 3000.

### Step 4: Make Changes and Save
After making modifications:
```javascript
webdev_save_checkpoint({
  brief: "Description of changes made",
  description: "Detailed changelog"
})
```

---

## Method 2: Using GitHub Clone (For Manual Setup)

### Prerequisites
- GitHub CLI authenticated
- Node.js 22.13.0+
- pnpm package manager
- MySQL/TiDB database access

### Step 1: Clone Repository
```bash
cd /home/ubuntu
gh repo clone ctfoutdoors/Hellcat-Ai-Oct-31-2025-10.12pm hellcat-intelligence
cd hellcat-intelligence
git checkout snapshot-2025-11-25
```

### Step 2: Install Dependencies
```bash
pnpm install
```

This will install all required packages including:
- React 19
- Express 4
- tRPC 11
- Drizzle ORM
- Tailwind CSS 4
- And 200+ other dependencies

### Step 3: Configure Environment Variables

Create a `.env` file or set environment variables:

```bash
# Database Configuration
DATABASE_URL="mysql://user:password@host:port/database?ssl=true"

# Authentication (Manus OAuth)
JWT_SECRET="your-jwt-secret"
OAUTH_SERVER_URL="https://api.manus.im"
VITE_APP_ID="your-app-id"
VITE_OAUTH_PORTAL_URL="https://login.manus.im"

# Owner Information
OWNER_OPEN_ID="owner-openid"
OWNER_NAME="Owner Name"

# Application Settings
VITE_APP_TITLE="Hellcat Intelligence Platform"
VITE_APP_LOGO="/logo.png"

# API Keys
BUILT_IN_FORGE_API_URL="https://forge.manus.im"
BUILT_IN_FORGE_API_KEY="your-forge-api-key"
VITE_FRONTEND_FORGE_API_KEY="your-frontend-key"
VITE_FRONTEND_FORGE_API_URL="https://forge.manus.im"

# WooCommerce Integration
WOOCOMMERCE_STORE_URL="https://your-store.com"
WOOCOMMERCE_CONSUMER_KEY="ck_xxxxx"
WOOCOMMERCE_CONSUMER_SECRET="cs_xxxxx"

# ShipStation Integration
Shipstation_API_PK="your-api-key"
Shipstation_API_Secret="your-api-secret"

# Analytics (Optional)
VITE_ANALYTICS_ENDPOINT="https://analytics.manus.im"
VITE_ANALYTICS_WEBSITE_ID="your-website-id"
```

### Step 4: Initialize Database Schema
```bash
pnpm db:push
```

This command:
- Reads schema from drizzle/schema.ts
- Generates SQL migrations
- Creates all tables, indexes, and foreign keys
- Applies schema to configured database

### Step 5: Start Development Server
```bash
pnpm dev
```

Server will start on http://localhost:3000

### Step 6: Verify Installation
```bash
pnpm test
```

Run test suite to verify all integrations are working.

---

## Project Structure

```
hellcat-intelligence/
├── client/                    # Frontend React application
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # React contexts
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utilities and tRPC client
│   │   ├── App.tsx          # Main app component with routing
│   │   ├── main.tsx         # Entry point
│   │   └── index.css        # Global styles
│   └── index.html           # HTML template
├── server/                   # Backend Express + tRPC
│   ├── _core/               # Framework internals (do not modify)
│   ├── services/            # Business logic services
│   ├── db.ts                # Database query helpers
│   ├── routers.ts           # tRPC API endpoints
│   └── index.ts             # Server entry point
├── drizzle/                 # Database schema and migrations
│   ├── schema.ts            # Table definitions
│   └── [migrations]/        # Generated SQL migrations
├── shared/                  # Shared types and constants
├── storage/                 # S3 storage helpers
├── backups/                 # Schema backups
├── todo.md                  # Project task tracking
├── DATABASE_SCHEMA.md       # Complete database documentation
├── DEPLOYMENT_GUIDE.md      # This file
└── package.json             # Dependencies and scripts
```

---

## Available Scripts

### Development
```bash
pnpm dev          # Start development server with hot reload
pnpm build        # Build for production
pnpm preview      # Preview production build
```

### Database
```bash
pnpm db:push      # Apply schema changes to database
pnpm db:studio    # Open Drizzle Studio (database GUI)
```

### Testing
```bash
pnpm test         # Run all tests with Vitest
pnpm test:watch   # Run tests in watch mode
```

### Code Quality
```bash
pnpm lint         # Run ESLint
pnpm typecheck    # Run TypeScript compiler check
```

---

## Key Features Overview

### CRM System
- Customer management (individuals and companies)
- Vendor management with contacts
- Lead tracking with kanban board
- Activity timelines
- Google Calendar integration
- Task management

### Case Management
- Carrier dispute tracking
- AI-powered case review
- Document generation (4 templates)
- PDF dispute letter creation
- Status workflow (11 stages)
- Evidence collection

### Integrations
- WooCommerce (customer and order import)
- ShipStation (auto-import USPS adjustments)
- Google Maps (route visualization)
- Google Calendar (meeting scheduling)
- Gmail (email tracking, partial)

### Product Management
- Product catalog
- Variant management
- Inventory tracking
- Pricing and margins
- Multi-channel sync

### AI Intelligence
- 120+ agent enterprise organization (designed, not fully active)
- Document parsing
- Mission control system
- Agent memory system

---

## Common Tasks

### Adding a New Database Table

1. Edit `drizzle/schema.ts`:
```typescript
export const myNewTable = mysqlTable("my_new_table", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
```

2. Apply to database:
```bash
pnpm db:push
```

3. Add query helpers in `server/db.ts`

4. Create tRPC endpoints in `server/routers.ts`

### Adding a New Page

1. Create component in `client/src/pages/MyPage.tsx`

2. Register route in `client/src/App.tsx`:
```typescript
<Route path="/my-page" component={MyPage} />
```

3. Add navigation link in sidebar (if using DashboardLayout)

### Adding a New tRPC Endpoint

1. Edit `server/routers.ts`:
```typescript
myFeature: router({
  list: protectedProcedure.query(async ({ ctx }) => {
    // Implementation
  }),
  create: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Implementation
    }),
}),
```

2. Use in frontend:
```typescript
const { data } = trpc.myFeature.list.useQuery();
const createMutation = trpc.myFeature.create.useMutation();
```

---

## Troubleshooting

### Database Connection Errors
- Verify DATABASE_URL is correctly set
- Ensure database server is accessible
- Check SSL/TLS requirements
- Confirm credentials are valid

### Dev Server Won't Start
- Check if port 3000 is already in use
- Verify all dependencies are installed
- Check for TypeScript compilation errors
- Review server logs for specific errors

### tRPC Errors
- Ensure server is running
- Check network requests in browser DevTools
- Verify endpoint exists in routers.ts
- Check authentication if using protectedProcedure

### Build Failures
- Run `pnpm typecheck` to find TypeScript errors
- Clear node_modules and reinstall: `rm -rf node_modules && pnpm install`
- Check for missing environment variables
- Review build logs for specific errors

---

## Deployment to Production

### Using Manus Platform (Recommended)

1. Create checkpoint:
```javascript
webdev_save_checkpoint({
  brief: "Ready for production deployment",
  description: "All features tested and verified"
})
```

2. Instruct user to click "Publish" button in Management UI

3. Changes deploy automatically to production URL

### Manual Deployment

Not recommended. The Manus platform handles:
- Build optimization
- Environment variable injection
- Database connection pooling
- SSL certificate management
- CDN configuration
- Auto-scaling

---

## Pending Features (73% Complete)

### Critical Before Scale
- Database optimization and indexing review
- SMTP configuration for email sending
- Comprehensive end-to-end testing

### Planned Enhancements
- AI Agent System activation (120+ agents designed)
- Advanced analytics dashboards
- Real-time WooCommerce webhooks
- eBay and Amazon integrations
- Document upload and storage system
- Automated workflow engine
- Mobile responsiveness improvements

---

## Security Considerations

### Environment Variables
Never commit .env files to Git. All secrets must be:
- Stored in environment variables
- Encrypted at rest
- Rotated regularly
- Limited to minimum required permissions

### Database Security
- Use SSL/TLS for all database connections
- Implement row-level security for multi-tenant scenarios
- Regular security audits
- Backup encryption

### API Security
- All sensitive endpoints use protectedProcedure
- JWT-based authentication
- OAuth 2.0 integration with Manus
- Rate limiting on API endpoints

---

## Support and Resources

### Documentation
- DATABASE_SCHEMA.md - Complete database reference
- todo.md - Current task list and progress
- Template README - Framework documentation

### Testing
- Vitest test suite in server/__tests__/
- Integration tests for all major features
- Run `pnpm test` before committing changes

### Code Quality
- TypeScript for type safety
- ESLint for code standards
- Prettier for formatting (if configured)
- Git hooks for pre-commit checks

---

## Handoff Checklist for New Agent

Before starting work, verify:

- [ ] Project restored to /home/ubuntu/hellcat-intelligence
- [ ] Dependencies installed (pnpm install completed)
- [ ] Database connection configured
- [ ] Dev server starts successfully
- [ ] Tests pass (pnpm test)
- [ ] Can access application at localhost:3000
- [ ] Review todo.md for current priorities
- [ ] Read DATABASE_SCHEMA.md for data model understanding

After making changes:

- [ ] Run tests to verify no regressions
- [ ] Update todo.md to mark completed items
- [ ] Test in browser for UI changes
- [ ] Create meaningful commit messages
- [ ] Save checkpoint or push to GitHub
- [ ] Document any new environment variables needed

---

## Contact and Escalation

For issues beyond this documentation:
- Review template README in project root
- Check Manus platform documentation
- Examine existing code patterns in similar features
- Review test files for usage examples

---

**End of Deployment Guide**

Last Updated: November 25, 2025  
Version: snapshot-2025-11-25  
Checkpoint: 10f8b112
