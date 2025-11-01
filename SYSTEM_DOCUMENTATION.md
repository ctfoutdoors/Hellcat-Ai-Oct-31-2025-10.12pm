# Carrier Dispute System - Technical Documentation

**Version:** 1.0.0  
**Author:** Manus AI  
**Last Updated:** October 29, 2025

---

## Executive Summary

The Carrier Dispute System is a comprehensive enterprise-grade platform designed to automate and streamline the process of managing carrier billing disputes, overcharges, and delivery guarantee violations. Built with modern web technologies and powered by artificial intelligence, the system provides end-to-end dispute management from detection through resolution, with advanced analytics and reporting capabilities.

The platform integrates with multiple external services including ShipStation for order management, Gmail for email correspondence, Google Calendar for deadline tracking, and Google Sheets for data synchronization. The system features a sophisticated AI assistant powered by OpenAI GPT-4 with function calling, web search, and voice transcription capabilities.

## System Architecture

### Technology Stack

The system employs a modern full-stack architecture with clear separation of concerns between the client and server layers.

**Frontend Technologies:** The client application is built with React 19 and TypeScript, providing type-safe component development. The UI framework leverages Tailwind CSS 4 for utility-first styling and shadcn/ui for accessible component primitives. State management is handled through TanStack Query (React Query) for server state and React hooks for local state. Navigation is implemented using Wouter, a lightweight routing library. Data visualization utilizes Recharts for interactive charts and graphs.

**Backend Technologies:** The server runs on Node.js with Express 4 as the web framework. API communication uses tRPC 11, which provides end-to-end type safety between client and server without code generation. The type-safe API layer ensures that frontend and backend remain synchronized, catching errors at compile time rather than runtime.

**Database Layer:** Data persistence is managed through Drizzle ORM connected to a PostgreSQL database. The schema includes 22 normalized tables covering cases, shipments, audits, activities, products, certifications, and user management. Drizzle provides type-safe query building and automatic migration generation.

**AI Integration:** OpenAI GPT-4 powers the intelligent assistant with function calling capabilities for structured outputs, web search for real-time information retrieval, and Whisper for audio transcription. The AI can analyze shipment costs, extract data from images, and provide contextual assistance.

**External Integrations:** The system connects to ShipStation API for order and shipment data, Gmail MCP for email automation, Google Calendar MCP for deadline management, and Google Sheets API for data synchronization. File storage is handled through AWS S3 with presigned URLs for secure access.

**Authentication:** User authentication is managed through OAuth 2.0 with JWT tokens, providing secure session management and role-based access control.

### Database Schema

The database architecture consists of 22 tables organized into logical domains.

**Case Management Tables:** The core `cases` table stores dispute case information including tracking numbers, carrier details, claimed amounts, status, and priority. Related tables include `case_activities` for timeline tracking, `case_attachments` for evidence files, and `case_documents` for generated dispute letters.

**Shipment Tables:** The `shipments` table contains order data synced from ShipStation, including tracking information, carrier details, shipping costs, and delivery dates. The `shipment_audits` table stores results from automated rate audits, flagging overcharges and undercharges.

**Product and Certification Tables:** The `products` table maintains the product catalog with SKUs, descriptions, and dimensions. The `certifications` table tracks rod tube certifications with expiry dates and associated documentation.

**User and Activity Tables:** User management is handled through `users` and `user_roles` tables. System activities are logged in `activities` for audit trails and analytics.

**Integration Tables:** Tables like `email_accounts`, `api_credentials`, and `service_accounts` store configuration for external service integrations.

### API Architecture

The API layer is built with tRPC, providing a type-safe contract between client and server. The router structure is organized by domain with the following main routers.

**Cases Router:** Handles all case-related operations including list, create, update, delete, and detail retrieval. Supports filtering by carrier, status, priority, and date ranges. Includes endpoints for generating dispute letters and managing attachments.

**Dashboard Router:** Provides aggregated metrics for the dashboard including total claimed, total recovered, success rates, and case distribution statistics. Returns data optimized for visualization components.

**Shipment Audits Router:** Manages the audit process for detecting rate discrepancies. Includes endpoints to run audits, retrieve audit results, and create cases from audit findings.

**Reports Router:** Generates comprehensive reports with filtering options. Supports multiple export formats including JSON, CSV, and PDF. Provides carrier performance analytics and timeline trends.

**Batch Operations Router:** Handles bulk operations on multiple cases including status updates, email sending, document generation, and CSV export.

**Gmail Router:** Manages email correspondence through Gmail MCP integration. Supports sending dispute letters, searching carrier responses, and sending case update notifications.

**Calendar Router:** Handles deadline and reminder management through Google Calendar MCP. Creates calendar events for case deadlines with multi-stage reminders.

**Workflow Router:** Manages automated workflow triggers and notifications based on case events.

## Core Features

### Case Management

The case management system provides comprehensive tracking of carrier disputes from creation through resolution. Each case includes detailed information about the shipment, carrier, claimed amount, and supporting evidence. The system maintains a complete activity timeline showing all updates, status changes, and communications.

Users can create cases manually through a form interface or automatically through audit detection. The case detail view provides tabs for overview, timeline, documents, and attachments. Evidence files can be uploaded via drag-and-drop with support for images, PDFs, and other document types. The system automatically generates dispute letters using templates populated with case data.

### AI Assistant

The AI assistant provides intelligent support throughout the dispute process. Users can interact with the assistant through a chat interface accessible from any page. The assistant can answer questions about carrier policies, analyze shipment costs, extract data from uploaded images, and transcribe voice recordings.

The assistant uses function calling to perform structured actions such as creating cases, searching for information, and analyzing documents. Web search capabilities allow the assistant to retrieve current carrier terms and policies. Voice transcription through Whisper enables users to record notes and have them automatically converted to text.

### Shipment Auditing

The automated auditing system compares quoted shipping rates against actual charged rates to detect discrepancies. The audit service analyzes shipment data from ShipStation, calculating differences and categorizing them by severity. Overcharges above configurable thresholds can automatically trigger case creation.

Audit results include detailed breakdowns by carrier, showing total audited shipments, overcharge counts, and total discrepancy amounts. The system provides carrier-specific statistics including average overcharge amounts and success rates.

### Delivery Guarantee Monitoring

The system monitors shipments for delivery guarantee violations by comparing promised delivery dates against actual delivery dates. When a violation is detected, the system calculates the eligible refund amount based on carrier policies and can automatically create a case for recovery.

### Email Integration

Gmail integration through MCP enables automated email correspondence. The system can send dispute letters directly to carrier billing departments, search for carrier responses, and send case update notifications. Email activities are logged in the case timeline for complete audit trails.

### Calendar Integration

Google Calendar integration manages deadlines and follow-up reminders. When a case is created, the system calculates the dispute filing deadline based on carrier policies and creates a calendar event with multi-stage reminders at 7 days, 3 days, and 1 day before the deadline. Follow-up reminders can be scheduled for specific dates.

### Batch Operations

Bulk operations allow users to perform actions on multiple cases simultaneously. Supported operations include status updates, priority changes, email sending, document generation, and CSV export. The batch system processes each case individually and reports success and failure counts with detailed error messages.

### Reporting and Analytics

The reporting system generates comprehensive analytics across multiple dimensions. Summary reports include total cases, claimed amounts, recovered amounts, success rates, and average recovery times. Reports can be filtered by date range, carrier, status, and other criteria.

Carrier performance reports show statistics for each carrier including case counts, success rates, average response times, and recovery rates. Timeline reports display monthly trends for cases filed, cases resolved, and amounts recovered. All reports support export to CSV format.

### Workflow Automation

The workflow automation system triggers actions based on case events. Registered triggers include case created, status changed, audit overcharge found, and delivery guarantee missed. Each trigger can execute multiple actions such as sending notifications, creating calendar events, or auto-creating cases.

The system includes auto-escalation based on case age and priority, automatic follow-up reminders after periods of inactivity, and intelligent status updates based on carrier email responses.

### Search and Filtering

Advanced search capabilities support multi-field text search across case numbers, tracking IDs, customer names, and notes. Filters include carrier, status, priority, date ranges, amount ranges, and assigned users. Results support sorting by any field in ascending or descending order with pagination.

The search service includes fuzzy matching using Levenshtein distance to find results even with spelling variations. Filter suggestions are automatically generated based on existing data.

### Caching and Performance

An in-memory caching layer optimizes performance for frequently accessed data. The cache supports time-to-live (TTL) expiration, pattern-based invalidation, and automatic cleanup of expired entries. Cache keys are organized by entity type with support for list, detail, and filtered queries.

The get-or-set pattern allows transparent caching where data is fetched from cache if available or computed and cached if not. Cache invalidation is triggered automatically when data is modified.

### Notification System

Real-time notifications keep users informed of case updates and system events. The notification service supports multiple types including info, success, warning, and error. Notifications include titles, messages, and optional links to related pages.

Users can subscribe to notifications with callback functions for real-time updates. The system includes templates for common events such as case created, case resolved, deadline approaching, and overcharge detected. Notifications support mark as read/unread and automatic cleanup of old notifications.

## Deployment and Operations

### Build Configuration

The build process is configured with increased Node.js memory allocation to handle large dependency trees. The production build compiles the client application with Vite and bundles the server with esbuild. The resulting artifacts are optimized for production deployment with code splitting and tree shaking.

### Environment Configuration

The system requires several environment variables for operation including database connection strings, API keys for external services, OAuth credentials, and S3 bucket configuration. Sensitive credentials are stored in the secrets management system accessible through the settings panel.

### Database Migrations

Database schema changes are managed through Drizzle Kit migrations. The migration workflow involves editing schema files, generating migration SQL, and applying migrations to the database. The `db:push` command combines generation and migration for development convenience.

### Monitoring and Logging

The system includes comprehensive logging for debugging and audit purposes. Cache operations, workflow triggers, and batch operations all log their activities. Error handling includes detailed error messages and stack traces for troubleshooting.

## Security Considerations

### Authentication and Authorization

User authentication is handled through OAuth 2.0 with JWT tokens. All API endpoints require authentication through the protected procedure pattern. Role-based access control ensures users can only access authorized resources.

### Data Protection

Sensitive data including API credentials and user information is encrypted at rest. File uploads are stored in S3 with presigned URLs for secure access. Database connections use SSL/TLS encryption.

### Input Validation

All user inputs are validated using Zod schemas on both client and server. Type safety is enforced throughout the application stack. SQL injection is prevented through parameterized queries via Drizzle ORM.

## Maintenance and Support

### Code Organization

The codebase follows a clear organizational structure with separation between client and server code. Services are organized by domain with single responsibility. Reusable utilities are extracted into shared modules.

### Testing Strategy

The system includes unit tests for core business logic and integration tests for API endpoints. The test suite uses Vitest for fast execution and TypeScript support.

### Documentation

Code documentation includes inline comments for complex logic, JSDoc annotations for public APIs, and comprehensive README files for setup and deployment.

---

**Document Version:** 1.0.0  
**Generated by:** Manus AI  
**Date:** October 29, 2025
