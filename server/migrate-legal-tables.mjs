import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function migrate() {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  try {
    console.log('Creating legal_references table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS legal_references (
        id INT AUTO_INCREMENT PRIMARY KEY,
        citation VARCHAR(255) NOT NULL,
        title VARCHAR(500) NOT NULL,
        summary VARCHAR(1000),
        category VARCHAR(100),
        jurisdiction VARCHAR(100),
        sourceUrl VARCHAR(500),
        relevanceScore INT DEFAULT 50,
        usageCount INT DEFAULT 0,
        isActive BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        applicableClaimTypes JSON,
        applicableCarriers JSON,
        INDEX idx_citation (citation),
        INDEX idx_category (category),
        INDEX idx_relevance (relevanceScore),
        INDEX idx_active (isActive)
      )
    `);
    console.log('✓ legal_references table created');

    console.log('Verifying carrier_terms table exists...');
    const [tables] = await connection.execute(`
      SHOW TABLES LIKE 'carrier_terms'
    `);
    
    if (tables.length === 0) {
      console.log('Creating carrier_terms table...');
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS carrier_terms (
          id INT AUTO_INCREMENT PRIMARY KEY,
          carrier VARCHAR(100) NOT NULL,
          termType VARCHAR(100) NOT NULL,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          section VARCHAR(255),
          effectiveDate DATE,
          sourceUrl VARCHAR(500),
          applicableClaimTypes JSON,
          usageCount INT DEFAULT 0,
          isActive BOOLEAN DEFAULT TRUE,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_carrier (carrier),
          INDEX idx_term_type (termType),
          INDEX idx_active (isActive),
          INDEX idx_carrier_type (carrier, termType)
        )
      `);
      console.log('✓ carrier_terms table created');
    } else {
      console.log('✓ carrier_terms table already exists');
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrate();
