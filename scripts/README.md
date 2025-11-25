# Database Utility Scripts

This directory contains utility scripts for database management, backup, and migration.

## Available Scripts

### export-database.ts

Exports database schema and optionally sample data for backup or migration purposes.

**Usage:**

Export schema information only:
```bash
pnpm tsx scripts/export-database.ts --schema-only
```

Export schema with sample data (first 10 rows per table):
```bash
pnpm tsx scripts/export-database.ts --with-data
```

**Output:**

Creates a JSON file in `backups/database/` with:
- Export timestamp
- Schema version
- List of all tables
- Row counts per table
- Sample data (if --with-data flag used)

**Requirements:**

- DATABASE_URL environment variable must be set for data export
- Database must be accessible and schema must be up to date

**Example Output:**

```json
{
  "exportedAt": "2025-11-25T12:00:00.000Z",
  "schemaVersion": "1.0",
  "schema": {
    "tables": ["users", "customers", "cases", ...],
    "totalTables": 45
  },
  "tables": {
    "users": {
      "rowCount": 12,
      "sampleData": [...]
    }
  }
}
```

## Adding New Scripts

When creating new utility scripts:

1. Use TypeScript for type safety
2. Add proper error handling
3. Include usage documentation
4. Support command-line arguments
5. Provide clear console output
6. Update this README

## Running Scripts

All scripts should be run using pnpm tsx:

```bash
pnpm tsx scripts/your-script.ts [arguments]
```

## Best Practices

- Always test scripts in development before production use
- Create backups before running destructive operations
- Use environment variables for sensitive configuration
- Log all operations for audit trail
- Handle errors gracefully with meaningful messages
