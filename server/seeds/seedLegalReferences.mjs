import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const legalReferencesData = [
  // UCC Article 2 - Sales
  {
    citation: "UCC § 2-314",
    title: "Implied Warranty of Merchantability",
    summary: "Establishes implied warranty that goods must be merchantable and fit for ordinary use",
    category: "ucc",
    jurisdiction: "Federal",
    relevanceScore: 85,
    sourceUrl: "https://www.law.cornell.edu/ucc/2/2-314",
    applicableCarriers: JSON.stringify(["UPS", "FedEx", "USPS", "DHL"]),
    applicableClaimTypes: JSON.stringify(["damage", "lost", "wrong_item"]),
    isActive: true,
  },
  {
    citation: "UCC § 2-509",
    title: "Risk of Loss in the Absence of Breach",
    summary: "Defines when risk of loss transfers from seller to buyer during shipping",
    category: "ucc",
    jurisdiction: "Federal",
    relevanceScore: 90,
    sourceUrl: "https://www.law.cornell.edu/ucc/2/2-509",
    applicableCarriers: JSON.stringify(["UPS", "FedEx", "USPS", "DHL"]),
    applicableClaimTypes: JSON.stringify(["damage", "lost"]),
    isActive: true,
  },
  
  // UCC Article 7 - Documents of Title
  {
    citation: "UCC § 7-309",
    title: "Duty of Care; Contractual Limitation of Carrier's Liability",
    summary: "Establishes carrier's duty of care and limits on contractual liability limitations",
    category: "ucc",
    jurisdiction: "Federal",
    relevanceScore: 95,
    sourceUrl: "https://www.law.cornell.edu/ucc/7/7-309",
    applicableCarriers: JSON.stringify(["UPS", "FedEx", "USPS", "DHL"]),
    applicableClaimTypes: JSON.stringify(["damage", "lost", "delay"]),
    isActive: true,
  },
  
  // 49 CFR Part 370 - Freight Loss and Damage Claims
  {
    citation: "49 CFR § 370.3",
    title: "Filing of Claims",
    summary: "Requirements for filing freight loss and damage claims with carriers",
    category: "federal_regulation",
    jurisdiction: "Federal",
    relevanceScore: 92,
    sourceUrl: "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-370/section-370.3",
    applicableCarriers: JSON.stringify(["UPS", "FedEx", "USPS", "DHL"]),
    applicableClaimTypes: JSON.stringify(["damage", "lost", "delay"]),
    isActive: true,
  },
  {
    citation: "49 CFR § 370.5",
    title: "Acknowledgment of Claims",
    summary: "Carrier must acknowledge receipt of claim within 30 days",
    category: "federal_regulation",
    jurisdiction: "Federal",
    relevanceScore: 88,
    sourceUrl: "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-370/section-370.5",
    applicableCarriers: JSON.stringify(["UPS", "FedEx", "USPS", "DHL"]),
    applicableClaimTypes: JSON.stringify(["damage", "lost", "delay"]),
    isActive: true,
  },
  {
    citation: "49 CFR § 370.9",
    title: "Disposition of Claims",
    summary: "Carrier must pay, decline, or make settlement offer within 120 days",
    category: "federal_regulation",
    jurisdiction: "Federal",
    relevanceScore: 90,
    sourceUrl: "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-370/section-370.9",
    applicableCarriers: JSON.stringify(["UPS", "FedEx", "USPS", "DHL"]),
    applicableClaimTypes: JSON.stringify(["damage", "lost", "delay"]),
    isActive: true,
  },
  
  // Carmack Amendment
  {
    citation: "49 U.S.C. § 14706",
    title: "Carmack Amendment - Carrier Liability",
    summary: "Establishes carrier liability for loss or damage to property during interstate commerce",
    category: "federal_statute",
    jurisdiction: "Federal",
    relevanceScore: 98,
    sourceUrl: "https://www.law.cornell.edu/uscode/text/49/14706",
    applicableCarriers: JSON.stringify(["UPS", "FedEx", "USPS", "DHL"]),
    applicableClaimTypes: JSON.stringify(["damage", "lost", "delay"]),
    isActive: true,
  },
  
  // State Laws
  {
    citation: "California Civil Code § 2194",
    title: "Carrier's Liability for Negligence",
    summary: "California law on carrier liability for negligence in handling goods",
    category: "state_law",
    jurisdiction: "California",
    relevanceScore: 75,
    sourceUrl: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=2194",
    applicableCarriers: JSON.stringify(["UPS", "FedEx", "USPS", "DHL"]),
    applicableClaimTypes: JSON.stringify(["damage", "lost"]),
    isActive: true,
  },
  {
    citation: "New York UCC § 7-309",
    title: "Duty of Care - New York",
    summary: "New York's adoption of UCC provisions on carrier duty of care",
    category: "state_law",
    jurisdiction: "New York",
    relevanceScore: 78,
    sourceUrl: "https://www.nysenate.gov/legislation/laws/UCC/7-309",
    applicableCarriers: JSON.stringify(["UPS", "FedEx", "USPS", "DHL"]),
    applicableClaimTypes: JSON.stringify(["damage", "lost", "delay"]),
    isActive: true,
  },
  
  // Consumer Protection
  {
    citation: "15 U.S.C. § 1692",
    title: "Fair Debt Collection Practices Act",
    summary: "Protections against abusive debt collection practices, applicable to carrier billing disputes",
    category: "consumer_protection",
    jurisdiction: "Federal",
    relevanceScore: 70,
    sourceUrl: "https://www.law.cornell.edu/uscode/text/15/chapter-41/subchapter-V",
    applicableCarriers: JSON.stringify(["UPS", "FedEx", "USPS", "DHL"]),
    applicableClaimTypes: JSON.stringify(["billing", "adjustment"]),
    isActive: true,
  },
  {
    citation: "16 CFR Part 435",
    title: "Mail, Internet, or Telephone Order Merchandise Rule",
    summary: "FTC rule requiring shipment within advertised timeframe or customer consent for delays",
    category: "consumer_protection",
    jurisdiction: "Federal",
    relevanceScore: 82,
    sourceUrl: "https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-435",
    applicableCarriers: JSON.stringify(["UPS", "FedEx", "USPS", "DHL"]),
    applicableClaimTypes: JSON.stringify(["delay", "sla_violation"]),
    isActive: true,
  },
];

async function seed() {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    console.log('Seeding legal references...');
    
    for (const ref of legalReferencesData) {
      await connection.execute(
        `INSERT INTO legal_references (
          citation, title, summary, category, jurisdiction, 
          relevanceScore, sourceUrl, applicableCarriers, applicableClaimTypes, isActive
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ref.citation,
          ref.title,
          ref.summary,
          ref.category,
          ref.jurisdiction,
          ref.relevanceScore,
          ref.sourceUrl,
          ref.applicableCarriers,
          ref.applicableClaimTypes,
          ref.isActive,
        ]
      );
      console.log(`✓ Inserted: ${ref.citation}`);
    }

    console.log(`\n✅ Successfully seeded ${legalReferencesData.length} legal references!`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seed();
