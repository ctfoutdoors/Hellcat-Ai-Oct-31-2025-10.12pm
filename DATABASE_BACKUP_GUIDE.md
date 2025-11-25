# Database Backup and Restoration Guide

**Date:** November 25, 2025  
**Project:** Hellcat Intelligence Platform

---

## Overview

This guide covers complete database backup and restoration procedures for the Hellcat Intelligence Platform. The database is a cloud-hosted MySQL/TiDB instance that requires special handling for backup and migration.

---

## What Has Been Backed Up

### 1. Database Schema (Complete)

**Location:** `backups/schema-20251125/`

**Contents:**
- schema.ts (112KB) - Complete Drizzle ORM schema definition
- All SQL migration files
- Migration metadata and journal

**Tables Documented:** 45+ tables across 8 modules
**Total Columns:** 300+
**Foreign Keys:** 25+
**Indexes:** 50+

### 2. Sample Data Export (JSON Format)

**Location:** `backups/database/database-export-2025-11-25T22-44-19-459Z.json`

**Contents:**
- 272 rows of sample data from 45 tables
- First 10 rows per table
- Complete row data with all columns
- Metadata about table structure

**File Size:** 108 KB

### 3. Sample Data Export (SQL Format)

**Location:** `backups/database/database-dump-2025-11-25T22-45-01-794Z.sql`

**Contents:**
- 272 INSERT statements
- 23 tables with data
- Ready-to-execute SQL format
- Foreign key handling included

**File Size:** 178 KB

---

## Database Connection Information

### Connection String Format

```
mysql://username:password@host:port/database?ssl=true
```

### Environment Variable

The database connection is stored in the `DATABASE_URL` environment variable.

**For Manus Webdev:** This is automatically injected when using `webdev_rollback_checkpoint`.

**For Manual Setup:** You must obtain the connection string separately. The database credentials are NOT stored in Git for security reasons.

### Accessing Database Directly

The Manus platform provides database access through:

1. **Management UI → Database Panel**
   - Visual CRUD interface
   - Connection details in bottom-left settings
   - Enable SSL for connections

2. **Drizzle Studio** (Local Development)
   ```bash
   pnpm db:studio
   ```
   Opens web interface at http://localhost:4983

3. **Direct MySQL Client**
   ```bash
   mysql -h host -P port -u username -p --ssl database
   ```

---

## Backup Procedures

### Method 1: Using Provided Scripts (Recommended)

#### Export Schema Only
```bash
cd /home/ubuntu/hellcat-intelligence
./export-db-schema.sh
```

Creates timestamped backup in `backups/schema-YYYYMMDD/`

#### Export Sample Data (JSON)
```bash
pnpm tsx scripts/export-database.ts --with-data
```

Creates JSON file in `backups/database/` with first 10 rows per table.

#### Export Sample Data (SQL)
```bash
pnpm tsx scripts/generate-sql-dump.ts
```

Creates SQL INSERT statements in `backups/database/`.

### Method 2: Using mysqldump (Full Backup)

For complete production backup with all data:

```bash
mysqldump -h host -P port -u username -p \
  --ssl-mode=REQUIRED \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  database > full-backup-$(date +%Y%m%d).sql
```

**Note:** Requires direct database access credentials.

### Method 3: Using Database Provider Tools

TiDB and most cloud database providers offer:
- Automated backups
- Point-in-time recovery
- Snapshot functionality
- Export to S3/cloud storage

Consult your database provider documentation.

---

## Restoration Procedures

### Prerequisites

Before restoring:
1. Have DATABASE_URL configured
2. Ensure target database is empty or prepared for data import
3. Have backup files available
4. Verify network connectivity to database

### Method 1: Restore Schema Only

```bash
cd /home/ubuntu/hellcat-intelligence
pnpm db:push
```

This reads `drizzle/schema.ts` and creates all tables, indexes, and foreign keys.

**Use when:**
- Setting up new environment
- Starting fresh with no data
- Schema has changed

### Method 2: Restore from JSON Export

```bash
pnpm tsx scripts/restore-database.ts --json backups/database/database-export-*.json
```

**Options:**
- `--skip-errors` - Continue on errors (useful for partial restore)

**Use when:**
- Restoring sample data
- Testing with known dataset
- Migrating specific records

### Method 3: Restore from SQL Dump

```bash
pnpm tsx scripts/restore-database.ts --sql backups/database/database-dump-*.sql
```

**Options:**
- `--skip-errors` - Continue on errors

**Use when:**
- Restoring from SQL export
- Migrating between MySQL-compatible databases
- Batch insert operations

### Method 4: Restore from Full mysqldump

```bash
mysql -h host -P port -u username -p --ssl database < full-backup.sql
```

**Use when:**
- Complete database restoration needed
- Disaster recovery
- Production migration

---

## Important Limitations

### What Is NOT in GitHub Backup

1. **Production Database Data**
   - Only sample data (272 rows) is backed up
   - Full production data requires separate backup
   - Reason: Size, security, and privacy concerns

2. **Database Credentials**
   - Connection strings not in Git
   - Passwords not stored
   - Reason: Security best practice

3. **Binary Data**
   - Large files (images, PDFs) stored in S3
   - Only URLs/keys in database
   - Reason: Database is for metadata only

### Sample Data vs. Full Data

The backups in GitHub contain:
- **Schema:** 100% complete
- **Data:** Sample only (first 10 rows per table)
- **Total Rows:** 272 out of potentially thousands

For full data backup, use mysqldump or database provider tools.

---

## Data Migration Workflow

### Moving to New Database

1. **Export from Source**
   ```bash
   mysqldump source_db > backup.sql
   ```

2. **Create Schema in Target**
   ```bash
   # Set new DATABASE_URL
   export DATABASE_URL="mysql://new-host/new-db"
   pnpm db:push
   ```

3. **Import Data**
   ```bash
   mysql new_db < backup.sql
   ```

4. **Verify**
   ```bash
   pnpm tsx scripts/export-database.ts --with-data
   # Check row counts
   ```

### Syncing Between Environments

Development → Staging → Production

1. **Schema Changes**
   - Edit `drizzle/schema.ts`
   - Test in development
   - Push to staging: `pnpm db:push`
   - Verify in staging
   - Push to production: `pnpm db:push`

2. **Data Migration**
   - Export from source
   - Transform if needed
   - Import to target
   - Verify integrity

---

## Backup Best Practices

### Frequency

- **Schema:** After every change (automated via Git)
- **Sample Data:** Weekly or before major changes
- **Full Data:** Daily (automated via database provider)

### Retention

- **Schema:** Keep all versions in Git
- **Sample Data:** Keep last 7 exports
- **Full Data:** Follow 3-2-1 rule (3 copies, 2 media, 1 offsite)

### Testing

- Verify backups can be restored
- Test restoration procedure monthly
- Document any issues encountered

### Security

- Never commit credentials to Git
- Encrypt backup files containing sensitive data
- Use secure transfer methods (SFTP, S3 with encryption)
- Limit access to backup files

---

## Troubleshooting

### Connection Errors

**Problem:** Cannot connect to database

**Solutions:**
- Verify DATABASE_URL is set correctly
- Check network connectivity
- Ensure SSL is enabled if required
- Verify credentials are valid
- Check firewall rules

### Schema Mismatch

**Problem:** Backup schema doesn't match target database

**Solutions:**
- Run `pnpm db:push` to sync schema
- Check migration history
- Verify you're using correct backup version
- Review schema changes in Git history

### Data Import Errors

**Problem:** Foreign key constraint violations

**Solutions:**
- Disable foreign key checks during import
- Import tables in dependency order
- Use `--skip-errors` flag for partial restore
- Check for missing parent records

### Insufficient Permissions

**Problem:** Access denied errors

**Solutions:**
- Verify database user has required permissions
- Check GRANT statements
- Ensure user can CREATE, INSERT, UPDATE, DELETE
- Contact database administrator

---

## Utility Scripts Reference

### export-db-schema.sh

Quick schema backup script.

**Usage:**
```bash
./export-db-schema.sh
```

**Output:** `backups/schema-YYYYMMDD/`

### scripts/export-database.ts

Comprehensive data export to JSON.

**Usage:**
```bash
pnpm tsx scripts/export-database.ts --schema-only
pnpm tsx scripts/export-database.ts --with-data
```

**Output:** `backups/database/database-export-*.json`

### scripts/generate-sql-dump.ts

SQL INSERT statements generator.

**Usage:**
```bash
pnpm tsx scripts/generate-sql-dump.ts
```

**Output:** `backups/database/database-dump-*.sql`

### scripts/restore-database.ts

Database restoration from exports.

**Usage:**
```bash
pnpm tsx scripts/restore-database.ts --json <file>
pnpm tsx scripts/restore-database.ts --sql <file>
pnpm tsx scripts/restore-database.ts --sql <file> --skip-errors
```

---

## For Another Agent

### Quick Start

1. **Restore Project**
   ```javascript
   webdev_rollback_checkpoint({ version_id: "10f8b112" })
   ```

2. **Verify Database Connection**
   ```bash
   pnpm db:push
   ```

3. **Check Current Data**
   ```bash
   pnpm tsx scripts/export-database.ts --with-data
   ```

### If Database Is Empty

The restored project will have schema but may not have data. This is normal.

**To populate with sample data:**
```bash
pnpm tsx scripts/restore-database.ts --json backups/database/database-export-*.json --skip-errors
```

### If You Need Full Data

Contact the original project owner for:
- Complete database dump
- Database connection credentials
- S3 access for file storage

---

## Production Considerations

### Before Going Live

1. Set up automated backups through database provider
2. Configure backup retention policy
3. Test restoration procedure
4. Document recovery time objective (RTO)
5. Document recovery point objective (RPO)

### Disaster Recovery Plan

1. **Detection:** Monitor database availability
2. **Assessment:** Determine extent of data loss
3. **Recovery:** Restore from most recent backup
4. **Verification:** Validate data integrity
5. **Resume:** Bring application back online

### Monitoring

- Database size and growth rate
- Backup success/failure
- Restoration test results
- Query performance metrics

---

## Summary

The database backup includes:
- Complete schema definition (45+ tables)
- Sample data (272 rows across 23 tables)
- Restoration scripts and utilities
- Comprehensive documentation

For full production backup, use database provider tools or mysqldump.

---

**Last Updated:** November 25, 2025  
**Backup Files:** backups/database/ and backups/schema-20251125/
