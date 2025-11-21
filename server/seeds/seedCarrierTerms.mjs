import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const carrierTermsData = [
  // UPS Terms
  {
    carrier: "UPS",
    termType: "liability",
    title: "UPS Limitation of Liability",
    content: "UPS's liability is limited to $100 per package unless additional insurance is purchased. For international shipments, liability is limited to the declared value.",
    section: "Terms and Conditions of Service - Section 2",
    effectiveDate: "2024-01-01",
    sourceUrl: "https://www.ups.com/us/en/support/shipping-support/legal-terms-conditions.page",
    applicableClaimTypes: JSON.stringify(["damage", "lost"]),
  },
  {
    carrier: "UPS",
    termType: "claims",
    title: "UPS Claims Filing Requirements",
    content: "Claims must be filed within 60 days of shipment date for domestic packages and 60 days for international. Claimant must provide proof of value and evidence of damage or loss.",
    section: "Claims Process - Section 4",
    effectiveDate: "2024-01-01",
    sourceUrl: "https://www.ups.com/us/en/support/file-a-claim.page",
    applicableClaimTypes: JSON.stringify(["damage", "lost"]),
  },
  {
    carrier: "UPS",
    termType: "packaging",
    title: "UPS Packaging Requirements",
    content: "Shipper is responsible for proper packaging. UPS may deny claims if damage results from inadequate packaging. Specific requirements apply for fragile items.",
    section: "Packaging Guidelines - Section 3",
    effectiveDate: "2024-01-01",
    sourceUrl: "https://www.ups.com/us/en/support/shipping-support/packaging.page",
    applicableClaimTypes: JSON.stringify(["damage"]),
  },
  {
    carrier: "UPS",
    termType: "guarantee",
    title: "UPS Service Guarantee",
    content: "UPS guarantees on-time delivery for certain services. If guarantee is not met, shipping charges may be refunded. Guarantee does not apply during peak seasons or force majeure events.",
    section: "Service Guarantee - Section 5",
    effectiveDate: "2024-01-01",
    sourceUrl: "https://www.ups.com/us/en/support/shipping-support/service-guarantee.page",
    applicableClaimTypes: JSON.stringify(["delay", "sla_violation"]),
  },
  
  // FedEx Terms
  {
    carrier: "FedEx",
    termType: "liability",
    title: "FedEx Limitation of Liability",
    content: "FedEx's liability is limited to $100 per package for most services unless declared value is purchased. Maximum liability varies by service type.",
    section: "Service Guide - Liability",
    effectiveDate: "2024-01-01",
    sourceUrl: "https://www.fedex.com/en-us/service-guide.html",
    applicableClaimTypes: JSON.stringify(["damage", "lost"]),
  },
  {
    carrier: "FedEx",
    termType: "claims",
    title: "FedEx Claims Process",
    content: "Claims must be filed within 21 days of delivery date or scheduled delivery date for lost packages. Proof of value and evidence of loss or damage required.",
    section: "Service Guide - Claims",
    effectiveDate: "2024-01-01",
    sourceUrl: "https://www.fedex.com/en-us/claims.html",
    applicableClaimTypes: JSON.stringify(["damage", "lost"]),
  },
  {
    carrier: "FedEx",
    termType: "packaging",
    title: "FedEx Packaging Standards",
    content: "Shipper must use packaging adequate to protect contents during normal handling. FedEx packaging guidelines specify requirements for different item types.",
    section: "Service Guide - Packaging",
    effectiveDate: "2024-01-01",
    sourceUrl: "https://www.fedex.com/en-us/packaging.html",
    applicableClaimTypes: JSON.stringify(["damage"]),
  },
  {
    carrier: "FedEx",
    termType: "guarantee",
    title: "FedEx Money-Back Guarantee",
    content: "FedEx offers money-back guarantee on select services if delivery commitment is not met. Exclusions apply for weather, customs delays, and other circumstances beyond FedEx control.",
    section: "Service Guide - Guarantee",
    effectiveDate: "2024-01-01",
    sourceUrl: "https://www.fedex.com/en-us/money-back-guarantee.html",
    applicableClaimTypes: JSON.stringify(["delay", "sla_violation"]),
  },
  
  // USPS Terms
  {
    carrier: "USPS",
    termType: "liability",
    title: "USPS Insurance Coverage",
    content: "USPS liability varies by service. Priority Mail includes $100 insurance. Additional insurance available up to $5,000 for most items.",
    section: "Domestic Mail Manual - Section 609",
    effectiveDate: "2024-01-01",
    sourceUrl: "https://pe.usps.com/text/dmm300/609.htm",
    applicableClaimTypes: JSON.stringify(["damage", "lost"]),
  },
  {
    carrier: "USPS",
    termType: "claims",
    title: "USPS Claims Filing",
    content: "Claims must be filed within specific timeframes: 60 days for domestic mail, 180 days for international. Online filing available through USPS website.",
    section: "Domestic Mail Manual - Section 609.4",
    effectiveDate: "2024-01-01",
    sourceUrl: "https://www.usps.com/help/claims.htm",
    applicableClaimTypes: JSON.stringify(["damage", "lost"]),
  },
  {
    carrier: "USPS",
    termType: "packaging",
    title: "USPS Packaging Standards",
    content: "Mailers must use packaging strong enough to protect contents through normal handling. USPS provides specific standards in Publication 52.",
    section: "Publication 52 - Packaging",
    effectiveDate: "2024-01-01",
    sourceUrl: "https://pe.usps.com/text/pub52/welcome.htm",
    applicableClaimTypes: JSON.stringify(["damage"]),
  },
  {
    carrier: "USPS",
    termType: "standards",
    title: "USPS Service Standards",
    content: "USPS publishes service standards for delivery timeframes by service type and destination. Standards are targets, not guarantees except for Express Mail.",
    section: "Service Standards",
    effectiveDate: "2024-01-01",
    sourceUrl: "https://www.usps.com/ship/service-standards.htm",
    applicableClaimTypes: JSON.stringify(["delay"]),
  },
  
  // DHL Terms
  {
    carrier: "DHL",
    termType: "liability",
    title: "DHL Liability Limits",
    content: "DHL's liability is limited to the lesser of actual value or $100 unless higher declared value is purchased. Maximum liability varies by service.",
    section: "Terms and Conditions - Liability",
    effectiveDate: "2024-01-01",
    sourceUrl: "https://www.dhl.com/us-en/home/footer/terms-of-use.html",
    applicableClaimTypes: JSON.stringify(["damage", "lost"]),
  },
  {
    carrier: "DHL",
    termType: "claims",
    title: "DHL Claims Procedure",
    content: "Claims must be filed within 30 days of shipment date. Claimant must provide commercial invoice, proof of value, and evidence of loss or damage.",
    section: "Claims Process",
    effectiveDate: "2024-01-01",
    sourceUrl: "https://www.dhl.com/us-en/home/tracking/claims.html",
    applicableClaimTypes: JSON.stringify(["damage", "lost"]),
  },
  {
    carrier: "DHL",
    termType: "packaging",
    title: "DHL Packaging Requirements",
    content: "Shipper responsible for proper packaging to withstand normal handling. DHL reserves right to refuse shipments with inadequate packaging.",
    section: "Packaging Guidelines",
    effectiveDate: "2024-01-01",
    sourceUrl: "https://www.dhl.com/us-en/home/our-divisions/express/packaging.html",
    applicableClaimTypes: JSON.stringify(["damage"]),
  },
  {
    carrier: "DHL",
    termType: "guarantee",
    title: "DHL Time Definite Guarantee",
    content: "DHL guarantees delivery by specific time for express services. Money-back guarantee available if commitment not met, subject to exclusions.",
    section: "Service Guarantee",
    effectiveDate: "2024-01-01",
    sourceUrl: "https://www.dhl.com/us-en/home/our-divisions/express/service-guarantee.html",
    applicableClaimTypes: JSON.stringify(["delay", "sla_violation"]),
  },
  
  // Amazon Logistics Terms
  {
    carrier: "Amazon Logistics",
    termType: "protection",
    title: "Amazon A-to-Z Guarantee",
    content: "Amazon provides A-to-Z Guarantee covering delivery and condition of items. Customers can file claims if items don't arrive or arrive damaged.",
    section: "A-to-Z Guarantee",
    effectiveDate: "2024-01-01",
    sourceUrl: "https://www.amazon.com/gp/help/customer/display.html?nodeId=GQ37ZCNECJKTFYQV",
    applicableClaimTypes: JSON.stringify(["damage", "lost", "wrong_item"]),
  },
  {
    carrier: "Amazon Logistics",
    termType: "claims",
    title: "Amazon Claims Process",
    content: "Claims handled through Amazon Seller Central or Buyer account. Must be filed within 90 days of estimated delivery date.",
    section: "Claims Policy",
    effectiveDate: "2024-01-01",
    sourceUrl: "https://sellercentral.amazon.com/gp/help/G200204080",
    applicableClaimTypes: JSON.stringify(["damage", "lost", "wrong_item"]),
  },
  {
    carrier: "Amazon Logistics",
    termType: "guarantee",
    title: "Amazon Delivery Guarantee",
    content: "Amazon guarantees delivery by promised date for Prime and other eligible orders. Refunds or credits available if guarantee not met.",
    section: "Delivery Guarantee",
    effectiveDate: "2024-01-01",
    sourceUrl: "https://www.amazon.com/gp/help/customer/display.html?nodeId=GE86W3K9Y7CKLW8P",
    applicableClaimTypes: JSON.stringify(["delay", "sla_violation"]),
  },
];

async function seed() {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    console.log('Seeding carrier terms...');
    
    for (const term of carrierTermsData) {
      await connection.execute(
        `INSERT INTO carrier_terms (
          carrier, termType, title, content, section, 
          effectiveDate, sourceUrl, applicableClaimTypes, isActive
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          term.carrier,
          term.termType,
          term.title,
          term.content,
          term.section,
          term.effectiveDate,
          term.sourceUrl,
          term.applicableClaimTypes,
          true,
        ]
      );
      console.log(`✓ Inserted: ${term.carrier} - ${term.title}`);
    }

    console.log(`\n✅ Successfully seeded ${carrierTermsData.length} carrier terms!`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seed();
