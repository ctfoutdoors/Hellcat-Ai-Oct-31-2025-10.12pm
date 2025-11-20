import { getDb } from "../db";
import { legalReferences } from "../../drizzle/schema";

/**
 * Seed Legal References Database
 * Populates UCC articles, federal regulations, and state laws
 * relevant to carrier disputes and shipping claims
 */

export const legalReferencesSeedData = [
  // UCC Article 2 - Sales
  {
    referenceType: "ucc" as const,
    citation: "UCC § 2-314",
    title: "Implied Warranty of Merchantability",
    jurisdiction: "Federal",
    fullText: "Unless excluded or modified, a warranty that the goods shall be merchantable is implied in a contract for their sale if the seller is a merchant with respect to goods of that kind. Goods to be merchantable must be at least such as (a) pass without objection in the trade under the contract description; and (b) in the case of fungible goods, are of fair average quality within the description; and (c) are fit for the ordinary purposes for which such goods are used.",
    summary: "Establishes implied warranty that goods must be merchantable and fit for ordinary use",
    applicableCarriers: ["UPS", "FedEx", "USPS", "DHL"],
    applicableClaimTypes: ["damage", "lost", "wrong_item"],
    relevanceScore: 85,
    sourceUrl: "https://www.law.cornell.edu/ucc/2/2-314",
    sourceDocument: "Uniform Commercial Code",
    tags: ["warranty", "merchantability", "goods", "sales"],
    isActive: true,
    createdBy: 1,
  },
  {
    referenceType: "ucc" as const,
    citation: "UCC § 2-509",
    title: "Risk of Loss in the Absence of Breach",
    jurisdiction: "Federal",
    fullText: "Where the contract requires or authorizes the seller to ship the goods by carrier (a) if it does not require him to deliver them at a particular destination, the risk of loss passes to the buyer when the goods are duly delivered to the carrier even though the shipment is under reservation; but (b) if it does require him to deliver them at a particular destination and the goods are there duly tendered while in the possession of the carrier, the risk of loss passes to the buyer when the goods are there duly so tendered as to enable the buyer to take delivery.",
    summary: "Defines when risk of loss transfers from seller to buyer during shipping",
    applicableCarriers: ["UPS", "FedEx", "USPS", "DHL"],
    applicableClaimTypes: ["damage", "lost"],
    relevanceScore: 90,
    sourceUrl: "https://www.law.cornell.edu/ucc/2/2-509",
    sourceDocument: "Uniform Commercial Code",
    tags: ["risk of loss", "shipping", "carrier", "delivery"],
    isActive: true,
    createdBy: 1,
  },
  
  // UCC Article 7 - Documents of Title
  {
    referenceType: "ucc" as const,
    citation: "UCC § 7-309",
    title: "Duty of Care; Contractual Limitation of Carrier's Liability",
    jurisdiction: "Federal",
    fullText: "(a) A carrier that issues a bill of lading, whether negotiable or nonnegotiable, shall exercise the degree of care in relation to the goods which a reasonably careful person would exercise under similar circumstances. (b) Damages may be limited by a term in the bill of lading or in a transportation agreement that the carrier's liability may not exceed a value stated in the bill or transportation agreement if the carrier's rates are dependent upon value and the consignor is afforded an opportunity to declare a higher value and the consignor is advised of the opportunity.",
    summary: "Establishes carrier's duty of care and allows limitation of liability with proper disclosure",
    applicableCarriers: ["UPS", "FedEx", "USPS", "DHL"],
    applicableClaimTypes: ["damage", "lost", "delay"],
    relevanceScore: 95,
    sourceUrl: "https://www.law.cornell.edu/ucc/7/7-309",
    sourceDocument: "Uniform Commercial Code",
    tags: ["duty of care", "liability", "carrier", "bill of lading"],
    isActive: true,
    createdBy: 1,
  },
  
  // Federal Regulations - 49 CFR Part 370
  {
    referenceType: "federal_regulation" as const,
    citation: "49 CFR § 370.3",
    title: "Filing of Claims",
    jurisdiction: "Federal",
    fullText: "Claims for loss, damage, injury, or delay to property must be filed in writing with the carrier within nine months after delivery of the property (or, in the case of export traffic, within nine months after delivery at the port of export), or in the case of failure to make delivery, then within nine months after a reasonable time for delivery has elapsed.",
    summary: "Establishes 9-month deadline for filing freight claims with carriers",
    applicableCarriers: ["UPS", "FedEx", "USPS", "DHL"],
    applicableClaimTypes: ["damage", "lost", "delay"],
    relevanceScore: 100,
    sourceUrl: "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-370",
    sourceDocument: "Code of Federal Regulations Title 49",
    tags: ["claims", "deadline", "filing", "freight"],
    isActive: true,
    createdBy: 1,
  },
  {
    referenceType: "federal_regulation" as const,
    citation: "49 CFR § 370.5",
    title: "Acknowledgment of Claims",
    jurisdiction: "Federal",
    fullText: "Every carrier shall acknowledge receipt of a claim within 30 days after receipt by the carrier. If the claim is not acknowledged within 30 days, the claimant may consider the claim denied and may proceed with legal action.",
    summary: "Requires carriers to acknowledge claims within 30 days",
    applicableCarriers: ["UPS", "FedEx", "USPS", "DHL"],
    applicableClaimTypes: ["damage", "lost", "delay"],
    relevanceScore: 90,
    sourceUrl: "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-370",
    sourceDocument: "Code of Federal Regulations Title 49",
    tags: ["acknowledgment", "claims", "deadline", "response"],
    isActive: true,
    createdBy: 1,
  },
  {
    referenceType: "federal_regulation" as const,
    citation: "49 CFR § 370.9",
    title: "Disposition of Claims",
    jurisdiction: "Federal",
    fullText: "Every carrier shall pay, decline, or make a firm compromise settlement offer in writing to the claimant within 120 days from the receipt of the claim by the carrier. If a claim is declined, the carrier shall provide the specific reasons for the declination.",
    summary: "Requires carriers to resolve claims within 120 days with specific reasons if declined",
    applicableCarriers: ["UPS", "FedEx", "USPS", "DHL"],
    applicableClaimTypes: ["damage", "lost", "delay"],
    relevanceScore: 95,
    sourceUrl: "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-370",
    sourceDocument: "Code of Federal Regulations Title 49",
    tags: ["resolution", "claims", "deadline", "payment"],
    isActive: true,
    createdBy: 1,
  },
  
  // Carmack Amendment
  {
    referenceType: "federal_regulation" as const,
    citation: "49 U.S.C. § 14706",
    title: "Carmack Amendment - Carrier Liability",
    jurisdiction: "Federal",
    fullText: "A carrier providing transportation or service subject to jurisdiction under chapter 135 shall issue a receipt or bill of lading for property it receives for transportation under this part. That carrier and any other carrier that delivers the property and is providing transportation or service subject to jurisdiction under chapter 135 or chapter 105 are liable to the person entitled to recover under the receipt or bill of lading.",
    summary: "Makes carriers strictly liable for loss or damage to goods in interstate commerce",
    applicableCarriers: ["UPS", "FedEx", "USPS", "DHL"],
    applicableClaimTypes: ["damage", "lost"],
    relevanceScore: 100,
    sourceUrl: "https://www.law.cornell.edu/uscode/text/49/14706",
    sourceDocument: "United States Code Title 49",
    tags: ["carmack", "liability", "interstate commerce", "carrier"],
    isActive: true,
    createdBy: 1,
  },
  
  // Contract Terms
  {
    referenceType: "contract_terms" as const,
    citation: "General Contract Law",
    title: "Duty to Mitigate Damages",
    jurisdiction: "Federal",
    fullText: "Under common law, a party injured by breach of contract has a duty to mitigate damages by taking reasonable steps to minimize the loss. Failure to mitigate may reduce the amount of damages recoverable.",
    summary: "Requires injured party to take reasonable steps to minimize losses",
    applicableCarriers: ["UPS", "FedEx", "USPS", "DHL"],
    applicableClaimTypes: ["damage", "lost", "delay"],
    relevanceScore: 70,
    sourceUrl: "https://www.law.cornell.edu/wex/mitigation_of_damages",
    sourceDocument: "Common Law",
    tags: ["mitigation", "damages", "contract", "duty"],
    isActive: true,
    createdBy: 1,
  },
  
  // State Laws - California
  {
    referenceType: "state_law" as const,
    citation: "Cal. Civ. Code § 1714",
    title: "General Negligence Standard",
    jurisdiction: "California",
    fullText: "Everyone is responsible, not only for the result of his or her willful acts, but also for an injury occasioned to another by his or her want of ordinary care or skill in the management of his or her property or person.",
    summary: "California's general negligence standard applicable to carrier handling of goods",
    applicableCarriers: ["UPS", "FedEx", "USPS", "DHL"],
    applicableClaimTypes: ["damage", "lost"],
    relevanceScore: 75,
    sourceUrl: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1714",
    sourceDocument: "California Civil Code",
    tags: ["negligence", "california", "duty of care"],
    isActive: true,
    createdBy: 1,
  },
  
  // State Laws - New York
  {
    referenceType: "state_law" as const,
    citation: "N.Y. Gen. Bus. Law § 349",
    title: "Deceptive Acts and Practices",
    jurisdiction: "New York",
    fullText: "Deceptive acts or practices in the conduct of any business, trade or commerce or in the furnishing of any service in this state are hereby declared unlawful.",
    summary: "Prohibits deceptive practices in business, applicable to carrier service representations",
    applicableCarriers: ["UPS", "FedEx", "USPS", "DHL"],
    applicableClaimTypes: ["delay", "sla_violation"],
    relevanceScore: 65,
    sourceUrl: "https://www.nysenate.gov/legislation/laws/GBS/349",
    sourceDocument: "New York General Business Law",
    tags: ["deceptive practices", "new york", "consumer protection"],
    isActive: true,
    createdBy: 1,
  },
  
  // Industry Standards
  {
    referenceType: "industry_standard" as const,
    citation: "NMFC Item 360",
    title: "National Motor Freight Classification - Packaging Standards",
    jurisdiction: "Federal",
    fullText: "Articles must be packed in boxes, crates, or other suitable containers to withstand normal transportation handling. Carrier liability for damage may be limited if packaging is inadequate for the nature of the goods and the transportation method.",
    summary: "Industry standard for proper packaging to maintain carrier liability",
    applicableCarriers: ["UPS", "FedEx", "DHL"],
    applicableClaimTypes: ["damage"],
    relevanceScore: 80,
    sourceUrl: "https://www.nmfta.org/",
    sourceDocument: "National Motor Freight Classification",
    tags: ["packaging", "standards", "liability", "freight"],
    isActive: true,
    createdBy: 1,
  },
];

/**
 * Seed the legal references database
 */
export async function seedLegalReferences() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    return;
  }

  console.log("Seeding legal references...");
  
  try {
    for (const reference of legalReferencesSeedData) {
      await db.insert(legalReferences).values(reference);
      console.log(`✓ Added: ${reference.citation}`);
    }
    
    console.log(`\n✅ Successfully seeded ${legalReferencesSeedData.length} legal references`);
  } catch (error) {
    console.error("Error seeding legal references:", error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seedLegalReferences()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
