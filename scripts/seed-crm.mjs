import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

// Sample data
const sampleContacts = [
  {
    name: 'John Smith',
    email: 'john.smith@acmecorp.com',
    phone: '+1 (555) 123-4567',
    jobTitle: 'CEO',
    contactType: 'b2b_distributor',
    lifecycleStage: 'customer',
    leadScore: 85,
    healthScore: 92,
    lifetimeValue: 450000, // $4,500 in cents
    churnProbability: 15,
    address: '123 Business Ave',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
    emailOptIn: 1,
    smsOptIn: 1,
    tags: JSON.stringify(['vip', 'enterprise']),
    lastActivityAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.j@techstartup.io',
    phone: '+1 (555) 234-5678',
    jobTitle: 'Founder',
    contactType: 'direct_owned',
    lifecycleStage: 'opportunity',
    leadScore: 72,
    healthScore: 88,
    lifetimeValue: 125000, // $1,250
    churnProbability: 25,
    address: '456 Startup Lane',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
    country: 'USA',
    emailOptIn: 1,
    smsOptIn: 0,
    tags: JSON.stringify(['tech', 'startup']),
    lastActivityAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
  },
  {
    name: 'Michael Chen',
    email: 'mchen@globalventures.com',
    phone: '+1 (555) 345-6789',
    jobTitle: 'VP of Operations',
    contactType: 'b2b_wholesale',
    lifecycleStage: 'customer',
    leadScore: 90,
    healthScore: 95,
    lifetimeValue: 780000, // $7,800
    churnProbability: 8,
    address: '789 Commerce Blvd',
    city: 'Chicago',
    state: 'IL',
    zipCode: '60601',
    country: 'USA',
    emailOptIn: 1,
    smsOptIn: 1,
    tags: JSON.stringify(['wholesale', 'high-value']),
    lastActivityAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    name: 'Emily Rodriguez',
    email: 'emily.r@marketplace.com',
    phone: '+1 (555) 456-7890',
    jobTitle: 'Buyer',
    contactType: 'marketplace',
    lifecycleStage: 'lead',
    leadScore: 45,
    healthScore: 70,
    lifetimeValue: 25000, // $250
    churnProbability: 40,
    address: '321 Market St',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    country: 'USA',
    emailOptIn: 1,
    smsOptIn: 0,
    tags: JSON.stringify(['marketplace', 'new']),
    lastActivityAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
  },
  {
    name: 'David Park',
    email: 'dpark@supplierco.net',
    phone: '+1 (555) 567-8901',
    jobTitle: 'Account Manager',
    contactType: 'vendor',
    lifecycleStage: 'customer',
    leadScore: 68,
    healthScore: 82,
    lifetimeValue: 320000, // $3,200
    churnProbability: 20,
    address: '654 Supply Chain Dr',
    city: 'Seattle',
    state: 'WA',
    zipCode: '98101',
    country: 'USA',
    emailOptIn: 1,
    smsOptIn: 1,
    tags: JSON.stringify(['vendor', 'reliable']),
    lastActivityAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  },
];

const sampleCompanies = [
  {
    name: 'Acme Corporation',
    website: 'https://acmecorp.com',
    industry: 'Manufacturing',
    accountType: 'customer',
    tier: 'enterprise',
    annualRevenue: 5000000, // $50M
    lifetimeValue: 450000,
    address: '123 Business Ave',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
    tags: JSON.stringify(['manufacturing', 'enterprise']),
  },
  {
    name: 'Tech Startup Inc',
    website: 'https://techstartup.io',
    industry: 'Technology',
    accountType: 'customer',
    tier: 'smb',
    annualRevenue: 500000, // $5M
    lifetimeValue: 125000,
    address: '456 Startup Lane',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
    country: 'USA',
    tags: JSON.stringify(['technology', 'saas']),
  },
  {
    name: 'Global Ventures LLC',
    website: 'https://globalventures.com',
    industry: 'Wholesale',
    accountType: 'customer',
    tier: 'mid-market',
    annualRevenue: 15000000, // $150M
    lifetimeValue: 780000,
    address: '789 Commerce Blvd',
    city: 'Chicago',
    state: 'IL',
    zipCode: '60601',
    country: 'USA',
    tags: JSON.stringify(['wholesale', 'distribution']),
  },
];

const sampleDeals = [
  {
    name: 'Q4 Expansion Deal - Acme Corp',
    description: 'Expand product line to include premium tier',
    companyId: 1,
    contactId: 1,
    ownerId: 1,
    stage: 'negotiation',
    amount: 250000, // $2,500
    probability: 75,
    expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    tags: JSON.stringify(['expansion', 'premium']),
  },
  {
    name: 'Initial Purchase - Tech Startup',
    description: 'First order for new customer',
    companyId: 2,
    contactId: 2,
    ownerId: 1,
    stage: 'proposal',
    amount: 50000, // $500
    probability: 50,
    expectedCloseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    tags: JSON.stringify(['new-customer', 'trial']),
  },
  {
    name: 'Annual Contract Renewal - Global Ventures',
    description: 'Renew annual wholesale agreement',
    companyId: 3,
    contactId: 3,
    ownerId: 1,
    stage: 'closed_won',
    amount: 500000, // $5,000
    probability: 100,
    expectedCloseDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    actualCloseDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    tags: JSON.stringify(['renewal', 'wholesale']),
  },
  {
    name: 'Marketplace Partnership - Emily Rodriguez',
    description: 'Partnership for marketplace sales channel',
    contactId: 4,
    ownerId: 1,
    stage: 'qualification',
    amount: 75000, // $750
    probability: 30,
    expectedCloseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
    tags: JSON.stringify(['partnership', 'marketplace']),
  },
  {
    name: 'Supplier Agreement - SupplierCo',
    description: 'New supplier partnership for raw materials',
    contactId: 5,
    ownerId: 1,
    stage: 'prospecting',
    amount: 150000, // $1,500
    probability: 20,
    expectedCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    tags: JSON.stringify(['supplier', 'materials']),
  },
];

async function seed() {
  console.log('🌱 Starting CRM seed...');
  
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);
  
  try {
    // Insert companies first
    console.log('📊 Seeding companies...');
    for (const company of sampleCompanies) {
      await connection.execute(
        `INSERT INTO companies (name, website, industry, accountType, tier, annualRevenue, lifetimeValue, address, city, state, zipCode, country, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = name`,
        [
          company.name,
          company.website,
          company.industry,
          company.accountType,
          company.tier,
          company.annualRevenue,
          company.lifetimeValue,
          company.address,
          company.city,
          company.state,
          company.zipCode,
          company.country,
          company.tags,
        ]
      );
    }
    console.log('✅ Companies seeded');
    
    // Insert contacts
    console.log('👥 Seeding contacts...');
    for (let i = 0; i < sampleContacts.length; i++) {
      const contact = sampleContacts[i];
      const companyId = i < 3 ? i + 1 : null; // First 3 contacts linked to companies
      
      await connection.execute(
        `INSERT INTO contacts (name, email, phone, jobTitle, contactType, lifecycleStage, leadScore, healthScore, lifetimeValue, churnProbability, address, city, state, zipCode, country, emailOptIn, smsOptIn, tags, lastActivityAt, companyId, ownerId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE email = email`,
        [
          contact.name,
          contact.email,
          contact.phone,
          contact.jobTitle,
          contact.contactType,
          contact.lifecycleStage,
          contact.leadScore,
          contact.healthScore,
          contact.lifetimeValue,
          contact.churnProbability,
          contact.address,
          contact.city,
          contact.state,
          contact.zipCode,
          contact.country,
          contact.emailOptIn,
          contact.smsOptIn,
          contact.tags,
          contact.lastActivityAt,
          companyId,
          1, // ownerId
        ]
      );
    }
    console.log('✅ Contacts seeded');
    
    // Insert deals
    console.log('💼 Seeding deals...');
    for (const deal of sampleDeals) {
      await connection.execute(
        `INSERT INTO deals (name, description, companyId, contactId, ownerId, stage, amount, probability, expectedCloseDate, actualCloseDate, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = name`,
        [
          deal.name,
          deal.description,
          deal.companyId || null,
          deal.contactId,
          deal.ownerId,
          deal.stage,
          deal.amount,
          deal.probability,
          deal.expectedCloseDate,
          deal.actualCloseDate || null,
          deal.tags,
        ]
      );
    }
    console.log('✅ Deals seeded');
    
    console.log('🎉 CRM seed completed successfully!');
    console.log('');
    console.log('Summary:');
    console.log(`  - ${sampleCompanies.length} companies`);
    console.log(`  - ${sampleContacts.length} contacts`);
    console.log(`  - ${sampleDeals.length} deals`);
    
  } catch (error) {
    console.error('❌ Error seeding CRM data:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

seed();
