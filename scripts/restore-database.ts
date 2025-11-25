/**
 * Database Restoration Script
 * Restores database from SQL dump or JSON export
 * 
 * Usage:
 *   pnpm tsx scripts/restore-database.ts --sql backups/database/database-dump-*.sql
 *   pnpm tsx scripts/restore-database.ts --json backups/database/database-export-*.json
 */

import mysql from 'mysql2/promise';
import * as fs from 'fs';
import * as path from 'path';

interface RestoreOptions {
  type: 'sql' | 'json';
  file: string;
  skipErrors: boolean;
}

async function restoreFromSQL(file: string, skipErrors: boolean) {
  console.log(`Restoring from SQL file: ${file}`);
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable not set');
  }
  
  const sqlContent = fs.readFileSync(file, 'utf-8');
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`Found ${statements.length} SQL statements`);
  
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  let executed = 0;
  let failed = 0;
  
  for (const statement of statements) {
    try {
      await connection.execute(statement);
      executed++;
      
      if (executed % 100 === 0) {
        console.log(`  Executed ${executed}/${statements.length} statements...`);
      }
    } catch (error: any) {
      failed++;
      
      if (skipErrors) {
        console.warn(`  Warning: ${error.message}`);
      } else {
        await connection.end();
        throw error;
      }
    }
  }
  
  await connection.end();
  
  console.log(`\n✓ Restoration completed`);
  console.log(`  Executed: ${executed}`);
  console.log(`  Failed: ${failed}`);
  
  return { executed, failed };
}

async function restoreFromJSON(file: string, skipErrors: boolean) {
  console.log(`Restoring from JSON file: ${file}`);
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable not set');
  }
  
  const jsonContent = JSON.parse(fs.readFileSync(file, 'utf-8'));
  const tables = jsonContent.tables || {};
  
  console.log(`Found ${Object.keys(tables).length} tables`);
  
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  let totalInserted = 0;
  let totalFailed = 0;
  
  for (const [tableName, tableData] of Object.entries(tables)) {
    const data = (tableData as any).sampleData;
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log(`  Skipping ${tableName} (no data)`);
      continue;
    }
    
    console.log(`  Restoring ${tableName} (${data.length} rows)...`);
    
    const tableSqlName = tableName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
    
    for (const row of data) {
      try {
        const columns = Object.keys(row);
        const values = Object.values(row).map(v => {
          if (v === null || v === undefined) return null;
          if (v instanceof Date) return v.toISOString().slice(0, 19).replace('T', ' ');
          if (typeof v === 'object') return JSON.stringify(v);
          return v;
        });
        
        const placeholders = values.map(() => '?').join(', ');
        const sql = `INSERT INTO \`${tableSqlName}\` (\`${columns.join('`, `')}\`) VALUES (${placeholders})`;
        
        await connection.execute(sql, values);
        totalInserted++;
      } catch (error: any) {
        totalFailed++;
        
        if (skipErrors) {
          console.warn(`    Warning: ${error.message}`);
        } else {
          await connection.end();
          throw error;
        }
      }
    }
  }
  
  await connection.end();
  
  console.log(`\n✓ Restoration completed`);
  console.log(`  Inserted: ${totalInserted}`);
  console.log(`  Failed: ${totalFailed}`);
  
  return { inserted: totalInserted, failed: totalFailed };
}

async function restoreDatabase(options: RestoreOptions) {
  console.log('Starting database restoration...\n');
  
  if (!fs.existsSync(options.file)) {
    throw new Error(`File not found: ${options.file}`);
  }
  
  if (options.type === 'sql') {
    return await restoreFromSQL(options.file, options.skipErrors);
  } else {
    return await restoreFromJSON(options.file, options.skipErrors);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: RestoreOptions = {
  type: args.includes('--sql') ? 'sql' : 'json',
  file: '',
  skipErrors: args.includes('--skip-errors'),
};

if (args.includes('--sql')) {
  const sqlIndex = args.indexOf('--sql');
  options.file = args[sqlIndex + 1];
} else if (args.includes('--json')) {
  const jsonIndex = args.indexOf('--json');
  options.file = args[jsonIndex + 1];
} else {
  console.error('Usage:');
  console.error('  pnpm tsx scripts/restore-database.ts --sql <file>');
  console.error('  pnpm tsx scripts/restore-database.ts --json <file>');
  console.error('  Add --skip-errors to continue on errors');
  process.exit(1);
}

restoreDatabase(options)
  .then(() => {
    console.log('\nDatabase restoration successful!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nDatabase restoration failed:', error.message);
    process.exit(1);
  });
