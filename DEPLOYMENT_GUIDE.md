# Deployment Guide and Production Checklist

**Version:** 1.0.0  
**Last Updated:** October 29, 2025

---

## Pre-Deployment Checklist

### Required API Keys and Credentials

Before deploying to production, ensure all required API keys and credentials are configured in the Settings → Secrets panel.

**OpenAI API Key** - Required for AI assistant functionality including GPT-4 chat, function calling, web search, and Whisper transcription. Obtain from platform.openai.com. Ensure production usage limits are configured.

**ShipStation API Credentials** - Required for order and shipment synchronization. Obtain API Key and API Secret from ShipStation account settings. Configure store connections and verify API access.

**Gmail API Credentials** - Required for email automation through Gmail MCP. Set up OAuth 2.0 credentials in Google Cloud Console. Configure authorized redirect URIs and scopes for Gmail API access.

**Google Calendar API Credentials** - Required for deadline tracking and reminder management. Use the same Google Cloud project as Gmail. Enable Calendar API and configure OAuth consent screen.

**Google Sheets API Credentials** - Required for data synchronization features. Enable Sheets API in Google Cloud Console. Generate service account credentials or OAuth tokens.

**AWS S3 Credentials** - Required for file storage. Create IAM user with S3 access. Configure bucket name, region, access key ID, and secret access key. Set appropriate bucket policies for public read access to uploaded files.

**Database Connection** - PostgreSQL connection string with SSL enabled. Verify database is accessible from production environment. Run all migrations before deployment.

**OAuth Configuration** - Manus OAuth credentials are pre-configured. Verify OAUTH_SERVER_URL and related variables are set correctly.

### Environment Variables

The following environment variables must be configured in production.

**OPENAI_API_KEY** - OpenAI API key for AI features  
**SHIPSTATION_API_KEY** - ShipStation API key  
**SHIPSTATION_API_SECRET** - ShipStation API secret  
**GMAIL_CLIENT_ID** - Google OAuth client ID for Gmail  
**GMAIL_CLIENT_SECRET** - Google OAuth client secret  
**CALENDAR_CLIENT_ID** - Google OAuth client ID for Calendar  
**CALENDAR_CLIENT_SECRET** - Google OAuth client secret  
**SHEETS_API_KEY** - Google Sheets API key or service account credentials  
**AWS_ACCESS_KEY_ID** - AWS access key for S3  
**AWS_SECRET_ACCESS_KEY** - AWS secret key for S3  
**AWS_REGION** - AWS region for S3 bucket  
**AWS_S3_BUCKET** - S3 bucket name for file storage  
**DATABASE_URL** - PostgreSQL connection string with SSL  
**JWT_SECRET** - Secret key for JWT token signing (auto-generated)  
**OAUTH_SERVER_URL** - OAuth server URL (pre-configured)  
**VITE_APP_TITLE** - Application title displayed in UI  
**VITE_APP_LOGO** - Application logo URL

### Database Setup

Ensure the database is properly configured and migrated before deployment.

**Create Database** - Create a PostgreSQL database with appropriate user permissions. Enable SSL connections for security.

**Run Migrations** - Execute `pnpm db:push` to generate and apply all schema migrations. Verify all 22 tables are created successfully.

**Verify Schema** - Check that all tables, indexes, and constraints are properly created. Review foreign key relationships and cascade rules.

**Backup Strategy** - Configure automated database backups with point-in-time recovery. Test restore procedures before going live.

### Security Configuration

Review and implement security best practices before production deployment.

**SSL/TLS** - Ensure all connections use HTTPS. Configure SSL certificates for custom domains. Enable HSTS headers.

**CORS Configuration** - Configure CORS policies to allow only authorized origins. Restrict API access to known client domains.

**Rate Limiting** - Implement rate limiting on API endpoints to prevent abuse. Configure appropriate limits for different endpoint types.

**Input Validation** - Verify all user inputs are validated using Zod schemas. Test for SQL injection, XSS, and CSRF vulnerabilities.

**Authentication** - Ensure OAuth flow is properly configured. Test login and logout functionality. Verify JWT token expiration and refresh.

**File Upload Security** - Configure file type restrictions and size limits. Scan uploaded files for malware. Use presigned URLs for S3 access.

### Performance Optimization

Optimize the application for production performance.

**Build Optimization** - Production build is configured with code splitting and tree shaking. Verify bundle sizes are reasonable.

**Caching Strategy** - In-memory cache is configured with TTL. Consider adding Redis for distributed caching in multi-instance deployments.

**Database Indexing** - Verify indexes are created on frequently queried columns. Monitor query performance and add indexes as needed.

**CDN Configuration** - Static assets are served through global CDN. Configure cache headers for optimal performance.

**Monitoring** - Set up application performance monitoring. Configure alerts for errors, slow queries, and high resource usage.

## Deployment Process

### Using Manus Platform

The simplest deployment method is through the Manus platform interface.

**Step 1: Create Checkpoint** - Save a checkpoint of the current project state. This creates a snapshot that can be deployed.

**Step 2: Configure Secrets** - In Management UI → Settings → Secrets, add all required API keys and credentials. Verify each secret is properly saved.

**Step 3: Test Preview** - Use the Preview panel to test the application in the development environment. Verify all features work correctly with production credentials.

**Step 4: Click Publish** - In the Management UI header, click the Publish button. This deploys the latest checkpoint to production.

**Step 5: Configure Domain** - In Settings → Domains, configure the auto-generated domain prefix or bind a custom domain. Update DNS records if using custom domain.

**Step 6: Verify Deployment** - Access the production URL and verify the application loads correctly. Test critical features including login, case creation, and AI assistant.

### Manual Deployment

For self-hosted deployments, follow these steps.

**Build Application** - Run `pnpm build` to create production bundles. This generates optimized client and server code in the `dist` directory.

**Prepare Server** - Set up a Node.js server with version 22.13.0 or higher. Install pnpm globally. Copy project files to server.

**Install Dependencies** - Run `pnpm install --prod` to install production dependencies only. This reduces deployment size.

**Configure Environment** - Create `.env` file with all required environment variables. Ensure sensitive credentials are not committed to version control.

**Run Migrations** - Execute `pnpm db:push` to apply database migrations. Verify all tables are created successfully.

**Start Application** - Run `pnpm start` to start the production server. The application runs on port 3000 by default.

**Configure Reverse Proxy** - Set up Nginx or similar reverse proxy to handle SSL termination and load balancing. Configure proxy headers for proper client IP detection.

**Process Management** - Use PM2 or systemd to manage the Node.js process. Configure automatic restart on failure and log rotation.

## Post-Deployment Verification

### Functional Testing

Verify all core features work correctly in production.

**Authentication** - Test login flow with Google OAuth. Verify users can sign in and access the dashboard.

**Case Management** - Create a test case with all fields populated. Upload attachments and verify they appear correctly. Generate a dispute letter and verify formatting.

**AI Assistant** - Open the chat widget and ask a test question. Verify the AI responds appropriately. Test image upload and voice recording features.

**Shipment Audits** - Run a shipment audit and verify results appear. Test creating a case from audit results.

**Email Integration** - Send a test email through Gmail integration. Verify email is sent and logged in case timeline.

**Calendar Integration** - Create a case with a deadline and verify calendar event is created. Check that reminders are scheduled correctly.

**Batch Operations** - Select multiple test cases and perform a batch update. Verify all cases are updated correctly.

**Reports** - Generate a report with filters applied. Export to CSV and verify data is correct.

### Performance Testing

Verify the application performs well under load.

**Page Load Times** - Measure initial page load time. Should be under 3 seconds on standard broadband connection.

**API Response Times** - Test API endpoints and verify response times are under 500ms for most queries. Database queries should use indexes effectively.

**Concurrent Users** - Test with multiple simultaneous users. Verify no performance degradation or errors.

**File Uploads** - Upload large files and verify they process within reasonable time. Test multiple simultaneous uploads.

**Cache Effectiveness** - Monitor cache hit rates. Verify frequently accessed data is served from cache.

### Monitoring Setup

Configure monitoring and alerting for production environment.

**Application Logs** - Set up centralized logging to collect application logs. Configure log levels appropriately for production.

**Error Tracking** - Implement error tracking to capture and report application errors. Configure alerts for critical errors.

**Performance Metrics** - Monitor response times, throughput, and resource usage. Set up dashboards for real-time visibility.

**Database Monitoring** - Track database query performance, connection pool usage, and slow queries. Configure alerts for anomalies.

**Uptime Monitoring** - Set up external uptime monitoring to detect outages. Configure alerts to notify team immediately.

## Maintenance Procedures

### Regular Maintenance Tasks

**Database Backups** - Verify automated backups are running successfully. Test restore procedures quarterly.

**Log Rotation** - Configure log rotation to prevent disk space issues. Archive old logs for compliance.

**Dependency Updates** - Review and update dependencies monthly. Test thoroughly before deploying updates.

**Security Patches** - Apply security patches promptly. Monitor security advisories for used packages.

**Cache Cleanup** - Monitor cache size and performance. Clear cache if issues arise.

**Notification Cleanup** - Old notifications are automatically cleaned up after 30 days. Verify cleanup is running.

### Troubleshooting Common Issues

**Build Failures** - If build fails with out of memory error, verify NODE_OPTIONS is set to increase memory limit. Current configuration uses 4096MB.

**Database Connection Errors** - Verify DATABASE_URL is correct and SSL is enabled. Check firewall rules allow connections.

**AI Assistant Not Responding** - Verify OPENAI_API_KEY is valid and has sufficient quota. Check API usage limits.

**Email Sending Fails** - Verify Gmail API credentials are valid and OAuth tokens are not expired. Check Gmail API quotas.

**File Upload Errors** - Verify S3 credentials are correct and bucket permissions allow uploads. Check CORS configuration.

**Cache Issues** - If stale data appears, clear cache using cache invalidation endpoints. Restart server if needed.

## Rollback Procedures

If issues arise after deployment, use the rollback feature to restore a previous checkpoint.

**Identify Issue** - Determine the scope and severity of the issue. Decide if rollback is necessary or if a hotfix is more appropriate.

**Select Checkpoint** - In Management UI, view checkpoint history. Select the last known good checkpoint.

**Initiate Rollback** - Click the Rollback button on the selected checkpoint. This restores code, configuration, and database schema to the checkpoint state.

**Verify Rollback** - Test the application after rollback to ensure it functions correctly. Check that the issue is resolved.

**Investigate Root Cause** - Analyze logs and error reports to determine what caused the issue. Fix the problem before attempting to redeploy.

## Support and Resources

**Documentation** - Refer to SYSTEM_DOCUMENTATION.md for technical details and architecture information.

**User Guide** - See userGuide.md for end-user instructions and feature descriptions.

**Code Repository** - Access full source code through Management UI → Code panel.

**Manus Support** - For platform-related issues, submit requests at https://help.manus.im

---

**Document Version:** 1.0.0  
**Author:** Manus AI  
**Date:** October 29, 2025
