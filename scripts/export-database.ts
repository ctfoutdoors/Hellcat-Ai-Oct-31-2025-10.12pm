/**
 * Database Export Utility
 * Exports database schema and optionally sample data for backup/migration
 * 
 * Usage:
 *   pnpm tsx scripts/export-database.ts --schema-only
 *   pnpm tsx scripts/export-database.ts --with-data
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../drizzle/schema';
import * as fs from 'fs';
import * as path from 'path';

interface ExportOptions {
  schemaOnly: boolean;
  withData: boolean;
  outputDir: string;
}

async function exportDatabase(options: ExportOptions) {
  const { schemaOnly, withData, outputDir } = options;
  
  console.log('Starting database export...');
  console.log(`Output directory: ${outputDir}`);
  console.log(`Schema only: ${schemaOnly}`);
  console.log(`Include data: ${withData}`);
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const exportFile = path.join(outputDir, `database-export-${timestamp}.json`);
  
  const exportData: any = {
    exportedAt: new Date().toISOString(),
    schemaVersion: '1.0',
    tables: {},
  };
  
  // Export schema information
  console.log('\nExporting schema information...');
  const tableNames = Object.keys(schema);
  exportData.schema = {
    tables: tableNames,
    totalTables: tableNames.length,
  };
  
  console.log(`Found ${tableNames.length} tables in schema`);
  
  if (withData && process.env.DATABASE_URL) {
    console.log('\nConnecting to database to export data...');
    
    try {
      const connection = await mysql.createConnection(process.env.DATABASE_URL);
      const db = drizzle(connection, { schema, mode: 'default' });
      
      // Export data from each table
      for (const tableName of tableNames) {
        const table = (schema as any)[tableName];
        
        // Skip if not a table definition
        if (!table || typeof table !== 'object' || !table[Symbol.for('drizzle:Name')]) {
          continue;
        }
        
        try {
          console.log(`Exporting data from ${tableName}...`);
          const data = await db.select().from(table);
          
          exportData.tables[tableName] = {
            rowCount: data.length,
            sampleData: data.slice(0, 10), // First 10 rows as sample
          };
          
          console.log(`  ✓ Exported ${data.length} rows (${Math.min(10, data.length)} in sample)`);
        } catch (error: any) {
          console.error(`  ✗ Error exporting ${tableName}:`, error.message);
          exportData.tables[tableName] = {
            error: error.message,
          };
        }
      }
      
      await connection.end();
    } catch (error: any) {
      console.error('Database connection error:', error.message);
      exportData.dataExportError = error.message;
    }
  }
  
  // Write export file
  fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2));
  console.log(`\n✓ Export completed: ${exportFile}`);
  
  // Generate summary
  console.log('\n=== Export Summary ===');
  console.log(`Tables in schema: ${exportData.schema.totalTables}`);
  
  if (withData) {
    const tablesWithData = Object.keys(exportData.tables).filter(
      t => exportData.tables[t].rowCount !== undefined
    );
    const totalRows = tablesWithData.reduce(
      (sum, t) => sum + (exportData.tables[t].rowCount || 0),
      0
    );
    
    console.log(`Tables with data: ${tablesWithData.length}`);
    console.log(`Total rows exported: ${totalRows}`);
  }
  
  return exportFile;
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: ExportOptions = {
  schemaOnly: args.includes('--schema-only'),
  withData: args.includes('--with-data'),
  outputDir: path.join(process.cwd(), 'backups', 'database'),
};

// Run export
exportDatabase(options)
  .then((file) => {
    console.log('\nDatabase export successful!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nDatabase export failed:', error);
    process.exit(1);
  });
