/**
 * SQL Dump Generator
 * Creates SQL INSERT statements from database tables for backup/migration
 * 
 * Usage:
 *   pnpm tsx scripts/generate-sql-dump.ts
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../drizzle/schema';
import * as fs from 'fs';
import * as path from 'path';

async function generateSQLDump() {
  console.log('Starting SQL dump generation...');
  
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL environment variable not set');
    process.exit(1);
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputDir = path.join(process.cwd(), 'backups', 'database');
  const sqlFile = path.join(outputDir, `database-dump-${timestamp}.sql`);
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  let sqlOutput = '';
  
  // Header
  sqlOutput += `-- Hellcat Intelligence Platform Database Dump\n`;
  sqlOutput += `-- Generated: ${new Date().toISOString()}\n`;
  sqlOutput += `-- Database: ${process.env.DATABASE_URL.split('@')[1]?.split('/')[1] || 'unknown'}\n`;
  sqlOutput += `--\n`;
  sqlOutput += `-- WARNING: This dump contains sample data only (first 100 rows per table)\n`;
  sqlOutput += `-- For complete backup, use mysqldump or database provider tools\n`;
  sqlOutput += `\n`;
  sqlOutput += `SET FOREIGN_KEY_CHECKS=0;\n\n`;
  
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    const db = drizzle(connection, { schema, mode: 'default' });
    
    const tableNames = Object.keys(schema);
    let totalRows = 0;
    let tablesProcessed = 0;
    
    for (const tableName of tableNames) {
      const table = (schema as any)[tableName];
      
      // Skip if not a table definition
      if (!table || typeof table !== 'object' || !table[Symbol.for('drizzle:Name')]) {
        continue;
      }
      
      try {
        console.log(`Processing ${tableName}...`);
        const data = await db.select().from(table).limit(100);
        
        if (data.length === 0) {
          console.log(`  Skipped (no data)`);
          continue;
        }
        
        tablesProcessed++;
        totalRows += data.length;
        
        sqlOutput += `--\n`;
        sqlOutput += `-- Table: ${tableName}\n`;
        sqlOutput += `-- Rows: ${data.length}\n`;
        sqlOutput += `--\n\n`;
        
        // Get column names from first row
        const columns = Object.keys(data[0]);
        const tableSqlName = tableName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
        
        for (const row of data) {
          const values = columns.map(col => {
            const value = (row as any)[col];
            
            if (value === null || value === undefined) {
              return 'NULL';
            }
            
            if (typeof value === 'string') {
              return `'${value.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
            }
            
            if (value instanceof Date) {
              return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
            }
            
            if (typeof value === 'boolean') {
              return value ? '1' : '0';
            }
            
            if (typeof value === 'object') {
              return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
            }
            
            return value.toString();
          });
          
          sqlOutput += `INSERT INTO \`${tableSqlName}\` (\`${columns.join('`, `')}\`) VALUES (${values.join(', ')});\n`;
        }
        
        sqlOutput += `\n`;
        console.log(`  ✓ Exported ${data.length} rows`);
        
      } catch (error: any) {
        console.error(`  ✗ Error: ${error.message}`);
      }
    }
    
    await connection.end();
    
    sqlOutput += `\nSET FOREIGN_KEY_CHECKS=1;\n`;
    sqlOutput += `\n-- Dump completed\n`;
    sqlOutput += `-- Tables processed: ${tablesProcessed}\n`;
    sqlOutput += `-- Total rows: ${totalRows}\n`;
    
    fs.writeFileSync(sqlFile, sqlOutput);
    
    console.log(`\n✓ SQL dump completed: ${sqlFile}`);
    console.log(`  Tables processed: ${tablesProcessed}`);
    console.log(`  Total rows: ${totalRows}`);
    console.log(`  File size: ${(fs.statSync(sqlFile).size / 1024).toFixed(2)} KB`);
    
  } catch (error: any) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
}

generateSQLDump()
  .then(() => {
    console.log('\nSQL dump generation successful!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nSQL dump generation failed:', error);
    process.exit(1);
  });
