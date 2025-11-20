import { getDb } from "../db";
import { carrierTerms } from "../../drizzle/schema";

/**
 * Seed Carrier Terms Database
 * Populates carrier-specific terms and conditions for major carriers
 */

export const carrierTermsSeedData = [
  // UPS Terms
  {
    carrier: "UPS",
    termType: "liability_limit",
    title: "UPS Declared Value Limit",
    content: "UPS's liability is limited to $100 per package unless a higher value is declared and additional charges are paid. For international shipments, liability is limited to $100 USD or equivalent.",
    section: "Terms and Conditions of Service",
    effectiveDate: new Date("2024-01-01"),
    sourceUrl: "https://www.ups.com/us/en/support/shipping-support/legal-terms-conditions.page",
    applicableClaimTypes: ["damage", "lost"],
    isActive: true,
  },
  {
    carrier: "UPS",
    termType: "claim_deadline",
    title: "UPS Claim Filing Deadline",
    content: "Claims for loss or damage must be filed within 60 days of the shipment date for domestic shipments and within 60 days for international shipments. Failure to file within this timeframe may result in denial of the claim.",
    section: "Claims Process",
    effectiveDate: new Date("2024-01-01"),
    sourceUrl: "https://www.ups.com/us/en/support/shipping-support/legal-terms-conditions.page",
    applicableClaimTypes: ["damage", "lost"],
    isActive: true,
  },
  {
    carrier: "UPS",
    termType: "exclusion",
    title: "UPS Packaging Requirements",
    content: "UPS is not liable for damage to improperly packaged items. Shippers must use appropriate packaging materials and methods. Items must be packed to withstand normal transportation handling.",
    section: "Packaging Guidelines",
    effectiveDate: new Date("2024-01-01"),
    sourceUrl: "https://www.ups.com/us/en/support/shipping-support/packaging-guidelines.page",
    applicableClaimTypes: ["damage"],
    isActive: true,
  },
  {
    carrier: "UPS",
    termType: "service_guarantee",
    title: "UPS Service Guarantee",
    content: "UPS guarantees delivery by the specified time for certain services. If delivery is late, customers may be eligible for a refund or credit. Service guarantee does not apply to shipments delayed due to circumstances beyond UPS's control.",
    section: "Service Guarantees",
    effectiveDate: new Date("2024-01-01"),
    sourceUrl: "https://www.ups.com/us/en/support/shipping-support/service-guarantees.page",
    applicableClaimTypes: ["delay", "sla_violation"],
    isActive: true,
  },
  
  // FedEx Terms
  {
    carrier: "FedEx",
    termType: "liability_limit",
    title: "FedEx Declared Value Coverage",
    content: "FedEx's liability is limited to $100 per package for most services unless a higher declared value is purchased. Maximum declared value varies by service type and destination.",
    section: "Service Guide - Liability",
    effectiveDate: new Date("2024-01-01"),
    sourceUrl: "https://www.fedex.com/en-us/service-guide.html",
    applicableClaimTypes: ["damage", "lost"],
    isActive: true,
  },
  {
    carrier: "FedEx",
    termType: "claim_deadline",
    title: "FedEx Claim Filing Timeframe",
    content: "Claims must be filed within 21 days of delivery date for damaged packages, and within 60 days of shipment date for lost packages. International claims must be filed within 21 days.",
    section: "Claims Procedures",
    effectiveDate: new Date("2024-01-01"),
    sourceUrl: "https://www.fedex.com/en-us/service-guide.html",
    applicableClaimTypes: ["damage", "lost"],
    isActive: true,
  },
  {
    carrier: "FedEx",
    termType: "exclusion",
    title: "FedEx Prohibited and Restricted Items",
    content: "FedEx is not liable for loss or damage to prohibited items, improperly packaged items, or items that require special handling but were not declared. Shippers must comply with all packaging requirements.",
    section: "Prohibited Items and Packaging",
    effectiveDate: new Date("2024-01-01"),
    sourceUrl: "https://www.fedex.com/en-us/shipping/packaging.html",
    applicableClaimTypes: ["damage", "lost"],
    isActive: true,
  },
  {
    carrier: "FedEx",
    termType: "service_guarantee",
    title: "FedEx Money-Back Guarantee",
    content: "FedEx offers a money-back guarantee for certain express services. If delivery is late, customers may request a refund. Guarantee does not apply to delays caused by weather, customs, or other events beyond FedEx's control.",
    section: "Money-Back Guarantee",
    effectiveDate: new Date("2024-01-01"),
    sourceUrl: "https://www.fedex.com/en-us/service-guide/money-back-guarantee.html",
    applicableClaimTypes: ["delay", "sla_violation"],
    isActive: true,
  },
  
  // USPS Terms
  {
    carrier: "USPS",
    termType: "liability_limit",
    title: "USPS Insurance Coverage",
    content: "USPS liability is limited to $100 for Priority Mail and $50 for First-Class Package Service unless additional insurance is purchased. Maximum insurance available is $5,000 for most domestic shipments.",
    section: "Domestic Mail Manual - Insurance",
    effectiveDate: new Date("2024-01-01"),
    sourceUrl: "https://pe.usps.com/text/dmm300/503.htm",
    applicableClaimTypes: ["damage", "lost"],
    isActive: true,
  },
  {
    carrier: "USPS",
    termType: "claim_deadline",
    title: "USPS Claim Filing Requirements",
    content: "Claims for damaged or lost mail must be filed within 60 days of the mailing date for domestic mail and within 180 days for international mail. Claims must include proof of value and mailing.",
    section: "Claims Procedures",
    effectiveDate: new Date("2024-01-01"),
    sourceUrl: "https://www.usps.com/help/claims.htm",
    applicableClaimTypes: ["damage", "lost"],
    isActive: true,
  },
  {
    carrier: "USPS",
    termType: "exclusion",
    title: "USPS Packaging Standards",
    content: "USPS is not liable for damage to items that are improperly packaged. Fragile items must be marked as fragile and packed with appropriate cushioning. Failure to meet packaging standards may result in claim denial.",
    section: "Packaging Guidelines",
    effectiveDate: new Date("2024-01-01"),
    sourceUrl: "https://www.usps.com/ship/packaging.htm",
    applicableClaimTypes: ["damage"],
    isActive: true,
  },
  {
    carrier: "USPS",
    termType: "service_standard",
    title: "USPS Service Standards",
    content: "USPS provides service standards for delivery times but does not guarantee delivery by a specific date or time for most services. Priority Mail Express is the only service with a money-back guarantee.",
    section: "Service Standards",
    effectiveDate: new Date("2024-01-01"),
    sourceUrl: "https://www.usps.com/ship/service-standards.htm",
    applicableClaimTypes: ["delay"],
    isActive: true,
  },
  
  // DHL Terms
  {
    carrier: "DHL",
    termType: "liability_limit",
    title: "DHL Liability Limitations",
    content: "DHL's liability is limited to the lesser of the actual value or $100 per package unless additional insurance is purchased. Maximum liability varies by service and destination.",
    section: "Terms and Conditions",
    effectiveDate: new Date("2024-01-01"),
    sourceUrl: "https://www.dhl.com/us-en/home/footer/terms-of-use.html",
    applicableClaimTypes: ["damage", "lost"],
    isActive: true,
  },
  {
    carrier: "DHL",
    termType: "claim_deadline",
    title: "DHL Claims Time Limits",
    content: "Claims must be filed within 30 days of delivery for damaged shipments and within 30 days of expected delivery for lost shipments. Late filing may result in automatic denial.",
    section: "Claims Process",
    effectiveDate: new Date("2024-01-01"),
    sourceUrl: "https://www.dhl.com/us-en/home/our-divisions/express/customer-service/claims.html",
    applicableClaimTypes: ["damage", "lost"],
    isActive: true,
  },
  {
    carrier: "DHL",
    termType: "exclusion",
    title: "DHL Packaging Requirements",
    content: "DHL requires proper packaging to maintain liability coverage. Items must be packed in sturdy containers with adequate cushioning. DHL is not liable for damage resulting from inadequate packaging.",
    section: "Packaging Guidelines",
    effectiveDate: new Date("2024-01-01"),
    sourceUrl: "https://www.dhl.com/us-en/home/our-divisions/express/shipping/packaging-guidelines.html",
    applicableClaimTypes: ["damage"],
    isActive: true,
  },
  {
    carrier: "DHL",
    termType: "service_guarantee",
    title: "DHL Express Time Definite Guarantee",
    content: "DHL Express offers a money-back guarantee for time-definite services. If delivery is late, customers may request a refund. Guarantee excludes delays due to customs, weather, or force majeure events.",
    section: "Service Guarantees",
    effectiveDate: new Date("2024-01-01"),
    sourceUrl: "https://www.dhl.com/us-en/home/our-divisions/express/customer-service/money-back-guarantee.html",
    applicableClaimTypes: ["delay", "sla_violation"],
    isActive: true,
  },
  
  // Amazon Logistics Terms
  {
    carrier: "Amazon Logistics",
    termType: "liability_limit",
    title: "Amazon Shipping Protection",
    content: "Amazon provides shipping protection for items fulfilled by Amazon. Coverage is automatically included up to the item's purchase price. Third-party sellers may have different policies.",
    section: "Amazon Shipping Policy",
    effectiveDate: new Date("2024-01-01"),
    sourceUrl: "https://www.amazon.com/gp/help/customer/display.html?nodeId=GQ37ZCNECJKTFYQV",
    applicableClaimTypes: ["damage", "lost"],
    isActive: true,
  },
  {
    carrier: "Amazon Logistics",
    termType: "claim_deadline",
    title: "Amazon Claim Process",
    content: "Claims for damaged or lost items must be filed through the Amazon customer service portal within 90 days of the order date. Amazon will investigate and provide a resolution within 48-72 hours.",
    section: "Returns and Refunds",
    effectiveDate: new Date("2024-01-01"),
    sourceUrl: "https://www.amazon.com/gp/help/customer/display.html?nodeId=GKM69DUUYKQWKWX7",
    applicableClaimTypes: ["damage", "lost"],
    isActive: true,
  },
  {
    carrier: "Amazon Logistics",
    termType: "service_guarantee",
    title: "Amazon Delivery Guarantee",
    content: "Amazon guarantees delivery by the estimated delivery date for Prime shipments. If delivery is late, customers may be eligible for a refund of shipping charges or Prime membership extension.",
    section: "Delivery Guarantees",
    effectiveDate: new Date("2024-01-01"),
    sourceUrl: "https://www.amazon.com/gp/help/customer/display.html?nodeId=GZXW7X6AKTHNUP6H",
    applicableClaimTypes: ["delay", "sla_violation"],
    isActive: true,
  },
];

/**
 * Seed the carrier terms database
 */
export async function seedCarrierTerms() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    return;
  }

  console.log("Seeding carrier terms...");
  
  try {
    for (const term of carrierTermsSeedData) {
      await db.insert(carrierTerms).values(term);
      console.log(`✓ Added: ${term.carrier} - ${term.title}`);
    }
    
    console.log(`\n✅ Successfully seeded ${carrierTermsSeedData.length} carrier terms`);
  } catch (error) {
    console.error("Error seeding carrier terms:", error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seedCarrierTerms()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
