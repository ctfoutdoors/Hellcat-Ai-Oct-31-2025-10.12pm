# Handoff Instructions for New Agent

**Date:** November 25, 2025  
**Project:** Hellcat Intelligence Platform  
**Repository:** ctfoutdoors/Hellcat-Ai-Oct-31-2025-10.12pm  
**Branch:** snapshot-2025-11-25  
**Latest Commit:** 7d03277

---

## Immediate Action Required

You are taking over the Hellcat Intelligence Platform project. This document provides everything needed to restore the project in your sandbox environment and continue development.

---

## Quick Start (Recommended Method)

### Option A: Using Manus Webdev System

If you have access to Manus webdev tools, use this method:

```javascript
webdev_rollback_checkpoint({
  brief: "Load hellcat-intelligence project from backup",
  version_id: "10f8b112"
})
```

This single command will:
- Restore all project files to /home/ubuntu/hellcat-intelligence
- Configure all environment variables and secrets
- Initialize database connection
- Set up webdev project context
- Enable all webdev tools

After restoration, verify with:

```javascript
webdev_check_status({
  brief: "Verify project loaded successfully"
})
```

Then start the development server:

```javascript
webdev_restart_server({
  brief: "Start development server"
})
```

---

### Option B: Manual GitHub Clone

If webdev tools are not available or not working:

```bash
# Step 1: Clone repository
cd /home/ubuntu
gh repo clone ctfoutdoors/Hellcat-Ai-Oct-31-2025-10.12pm hellcat-intelligence

# Step 2: Switch to snapshot branch
cd hellcat-intelligence
git checkout snapshot-2025-11-25

# Step 3: Install dependencies
pnpm install

# Step 4: Configure environment (see Environment Variables section below)

# Step 5: Initialize database
pnpm db:push

# Step 6: Start development server
pnpm dev
```

---

## Environment Variables Required

If using manual setup, you must configure these environment variables. In Manus webdev, these are auto-injected.

### Critical Variables

```bash
# Database
DATABASE_URL="mysql://user:password@host:port/database?ssl=true"

# Authentication
JWT_SECRET="your-jwt-secret"
OAUTH_SERVER_URL="https://api.manus.im"
VITE_APP_ID="your-app-id"
VITE_OAUTH_PORTAL_URL="https://login.manus.im"

# Owner
OWNER_OPEN_ID="owner-openid"
OWNER_NAME="Owner Name"

# Application
VITE_APP_TITLE="Hellcat Intelligence Platform"
VITE_APP_LOGO="/logo.png"

# APIs
BUILT_IN_FORGE_API_URL="https://forge.manus.im"
BUILT_IN_FORGE_API_KEY="your-api-key"
VITE_FRONTEND_FORGE_API_KEY="frontend-key"
VITE_FRONTEND_FORGE_API_URL="https://forge.manus.im"

# WooCommerce
WOOCOMMERCE_STORE_URL="https://your-store.com"
WOOCOMMERCE_CONSUMER_KEY="ck_xxxxx"
WOOCOMMERCE_CONSUMER_SECRET="cs_xxxxx"

# ShipStation
Shipstation_API_PK="api-key"
Shipstation_API_Secret="api-secret"
```

---

## Project Status Overview

### Completion: 73%

**What Works:**
- CRM system (customers, vendors, leads)
- Case management with AI review
- Document generation (4 PDF templates)
- Google Calendar integration
- Task management
- WooCommerce import
- ShipStation auto-import
- Product management
- Order tracking
- Email integration (partial)

**What Needs Work:**
- Database optimization (critical before scale)
- SMTP configuration for email sending
- AI Agent System activation (designed but not active)
- Advanced analytics dashboards
- Document upload system
- eBay/Amazon integrations

---

## Key Files to Review

### Must Read First
1. **todo.md** - Complete task list with 916 pending items
2. **DATABASE_SCHEMA.md** - All 45+ database tables documented
3. **DEPLOYMENT_GUIDE.md** - Comprehensive deployment instructions

### Code Structure
- **server/routers.ts** - All tRPC API endpoints
- **drizzle/schema.ts** - Database schema definitions
- **client/src/App.tsx** - Frontend routing
- **client/src/pages/** - All page components

### Testing
- **server/__tests__/** - Test suite
- Run with: `pnpm test`

---

## Common First Tasks

### 1. Verify Everything Works

```bash
# Check database connection
pnpm db:push

# Run tests
pnpm test

# Start dev server
pnpm dev

# Access at http://localhost:3000
```

### 2. Review Current Priorities

```bash
# Read the todo list
cat todo.md | grep "^\- \[ \]" | head -20
```

### 3. Check for Issues

```bash
# Look for TypeScript errors
pnpm typecheck

# Check for linting issues
pnpm lint
```

---

## Making Changes

### Standard Workflow

1. Make code changes
2. Test locally: `pnpm dev`
3. Run tests: `pnpm test`
4. Update todo.md (mark completed items with [x])
5. Save checkpoint or commit to git

### Database Changes

1. Edit `drizzle/schema.ts`
2. Apply changes: `pnpm db:push`
3. Verify in Drizzle Studio: `pnpm db:studio`
4. Update DATABASE_SCHEMA.md if needed

### Adding Features

1. Add to todo.md first
2. Create database tables if needed
3. Add tRPC endpoints in server/routers.ts
4. Create frontend pages in client/src/pages/
5. Add routes in client/src/App.tsx
6. Test thoroughly
7. Mark as complete in todo.md

---

## Saving Your Work

### Using Webdev Tools

```javascript
webdev_save_checkpoint({
  brief: "Description of changes",
  description: "Detailed changelog with bullet points"
})
```

### Using Git Manually

```bash
git add .
git commit -m "Description of changes"
git push github snapshot-2025-11-25
```

---

## Troubleshooting

### Project Not Found Error

If you see "project_id is required" or "project not found":

1. You are in a new chat session without project context
2. Use `webdev_rollback_checkpoint` to load the project
3. Or clone from GitHub manually

### Database Connection Errors

1. Verify DATABASE_URL is set correctly
2. Check database is accessible
3. Ensure SSL is enabled if required
4. Test connection: `pnpm db:push`

### Dev Server Won't Start

1. Check if port 3000 is in use
2. Kill existing processes: `pkill -f "vite"`
3. Clear node_modules: `rm -rf node_modules && pnpm install`
4. Check for TypeScript errors: `pnpm typecheck`

### Tests Failing

1. Review test output for specific errors
2. Check database connection
3. Verify environment variables are set
4. Run individual test files to isolate issues

---

## Important Notes

### Do Not Modify

- Files in `server/_core/` - Framework internals
- Files in `node_modules/` - Dependencies
- Files in `.git/` - Version control

### Always Update

- `todo.md` - Mark completed tasks
- `DATABASE_SCHEMA.md` - When schema changes
- Test files - When adding features

### Before Deploying

- Run full test suite: `pnpm test`
- Check TypeScript: `pnpm typecheck`
- Review todo.md for critical items
- Create checkpoint with meaningful description

---

## Resources

### Documentation
- DATABASE_SCHEMA.md - Database reference
- DEPLOYMENT_GUIDE.md - Deployment instructions
- scripts/README.md - Utility scripts
- Template README - Framework documentation

### Testing
- Run all tests: `pnpm test`
- Watch mode: `pnpm test:watch`
- Coverage: `pnpm test:coverage` (if configured)

### Database
- Studio GUI: `pnpm db:studio`
- Push schema: `pnpm db:push`
- Generate migration: `pnpm drizzle-kit generate`

---

## Next Steps

After successfully loading the project:

1. Review todo.md for current priorities
2. Check DATABASE_SCHEMA.md to understand data model
3. Run `pnpm test` to verify everything works
4. Start dev server and test in browser
5. Pick a task from todo.md and begin work

---

## Critical Reminders

- This project uses tRPC - all API endpoints are in server/routers.ts
- Database changes require `pnpm db:push`
- Always mark completed tasks in todo.md
- Test before saving checkpoints
- Document any new environment variables needed
- Keep DATABASE_SCHEMA.md updated with schema changes

---

## Contact Information

For issues beyond this documentation:
- Review existing code patterns
- Check test files for examples
- Examine template README
- Review Manus platform documentation

---

## Verification Checklist

Before starting work, confirm:

- [ ] Project restored to /home/ubuntu/hellcat-intelligence
- [ ] Dependencies installed (node_modules exists)
- [ ] Database connection works (pnpm db:push succeeds)
- [ ] Dev server starts (pnpm dev works)
- [ ] Tests pass (pnpm test succeeds)
- [ ] Can access http://localhost:3000
- [ ] Have read todo.md
- [ ] Have read DATABASE_SCHEMA.md
- [ ] Understand project structure

After making changes:

- [ ] Tests still pass
- [ ] No TypeScript errors
- [ ] todo.md updated
- [ ] Changes committed or checkpoint saved
- [ ] Documentation updated if needed

---

**You are now ready to continue development on the Hellcat Intelligence Platform.**

Good luck, and remember to save checkpoints frequently.

---

**Last Updated:** November 25, 2025  
**Commit:** 7d03277  
**Branch:** snapshot-2025-11-25
