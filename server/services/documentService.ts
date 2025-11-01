/**
 * Document Generation Service
 * Generates dispute letters and other documents with proper appendix references
 */

interface Attachment {
  fileName: string;
  fileUrl: string;
  fileType: string;
}

interface DisputeLetterData {
  caseNumber: string;
  trackingId: string;
  carrier: string;
  carrierBillingDept?: string;
  carrierLegalAddress?: string;
  adjustmentDate: string;
  originalAmount: string;
  adjustedAmount: string;
  claimedAmount: string;
  actualDimensions: string;
  carrierDimensions: string;
  serviceType: string;
  customerName?: string;
  companyName: string;
  yourName: string;
  yourTitle: string;
  yourEmail: string;
  yourPhone: string;
  notes?: string;
  attachments?: Attachment[];
}

/**
 * Generate dispute letter content with appendix references
 */
export function generateDisputeLetter(data: DisputeLetterData): string {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const carrierBillingDepts: Record<string, string> = {
    FEDEX: 'FedEx Billing Department',
    UPS: 'UPS Billing Department',
    USPS: 'USPS Customer Service',
    DHL: 'DHL Billing Department',
    OTHER: 'Billing Department',
  };

  const carrierAddresses: Record<string, string> = {
    FEDEX: 'FedEx Corporate Headquarters, 942 South Shady Grove Road, Memphis, TN 38120',
    UPS: 'UPS Corporate Headquarters, 55 Glenlake Parkway NE, Atlanta, GA 30328',
    USPS: 'United States Postal Service, 475 L\'Enfant Plaza SW, Washington, DC 20260',
    DHL: 'DHL Express USA, 1200 South Pine Island Road, Plantation, FL 33324',
    OTHER: data.carrierLegalAddress || 'Carrier Address',
  };

  const billingDept = data.carrierBillingDept || carrierBillingDepts[data.carrier] || 'Billing Department';
  const legalAddress = data.carrierLegalAddress || carrierAddresses[data.carrier] || 'Carrier Legal Address';

  // Generate appendix references
  const appendices = (data.attachments || []).map((att, index) => ({
    letter: String.fromCharCode(65 + index), // A, B, C, etc.
    fileName: att.fileName,
    fileUrl: att.fileUrl,
    fileType: att.fileType,
  }));

  const appendixReferences = appendices.map(app => 
    `Appendix ${app.letter}: ${app.fileName}`
  ).join('\n');

  return `CTF Group LLC
1458 Old Durham Rd. Roxboro, NC - 27573

Date: ${today}

To: ${billingDept}
Legal Address: ${legalAddress}

Subject: Formal Dispute of Erroneous Shipping Adjustment – Tracking ID ${data.trackingId}

Dear ${billingDept},

I am writing on behalf of ${data.companyName} to dispute the billing adjustment applied on ${data.adjustmentDate}, associated with shipment ${data.trackingId}. The adjustment alleges that the dimensions of the package were ${data.carrierDimensions}, which triggered surcharges including dimensional weight pricing, fuel surcharge, residential delivery, and additional handling fees. However, our authoritative records, manufacturer documentation, and third-party logistics provider data confirm that the package dimensions were ${data.actualDimensions} and complied with standard shipping specifications.

BACKGROUND
----------
Case Number: ${data.caseNumber}
Service: ${data.serviceType}
Tracking Number: ${data.trackingId}
Original Amount Charged: ${data.originalAmount}
Adjusted Amount: ${data.adjustedAmount}
Disputed Amount: ${data.claimedAmount}
Actual Package Dimensions (Verified): ${data.actualDimensions}
Carrier's Claimed Dimensions (Disputed): ${data.carrierDimensions}

FACTUAL BASIS FOR DISPUTE
--------------------------
1. AUTHORITATIVE SOURCE DATA
   Our shipping management system (ShipStation) serves as our authoritative system of record for all shipments. This system recorded the package dimensions as ${data.actualDimensions} at the time of shipment creation and label generation (see Appendix A: ShipStation shipment details).

2. MANUFACTURER DOCUMENTATION
   The shipping containers used are standardized products manufactured by Yazoo Mills Inc. The manufacturer's order acknowledgment (Appendix B) confirms the standard dimensions of our shipping tubes: 92" x 2" x 2", 92" x 3.18" x 3.18", and 92" x 4" x 4". These are consistent, standardized commercial products with uniform dimensions across all units.

3. THIRD-PARTY LOGISTICS PROVIDER
   All order fulfillment is executed by our 3PL provider, Pitman Creek Distribution, located at 213 Tech Way, Stanford, KY 40484. This professional fulfillment operation maintains strict quality control and dimensional consistency for all shipments.

4. CARRIER'S OWN DELIVERY EVIDENCE
   The carrier's delivery proof photograph (Appendix C) shows the package is a cylindrical tube. A cylindrical tube with a 4-inch diameter (10.16 cm) cannot physically have cross-sectional dimensions of 5" x 5" (12.70 cm x 12.70 cm) as claimed by the carrier. This is a mathematical and physical impossibility.

UNIT CONVERSION ANALYSIS
-------------------------
The carrier's dimensional claim contains a critical measurement error:

Actual Dimensions (CTF/ShipStation): 92" x 4" x 4"
  Converted to metric: 233.68 cm x 10.16 cm x 10.16 cm

Carrier's Claimed Dimensions: 231.14 cm x 12.70 cm x 12.70 cm
  Converted to inches: ~91" x 5" x 5"

The carrier's claim of 12.70 cm (5 inches) for the cross-sectional dimensions represents a 25% measurement error compared to the actual 10.16 cm (4 inches). This error pushed the package into a higher dimensional weight bracket, resulting in the erroneous surcharge.

COMMERCIAL PROOF STANDARD
--------------------------
Due to the large-scale, standardized nature of our operations, individual package photographs for each shipment are not operationally feasible. Industry-standard commercial proof relies on:
- Manufacturer specifications and documentation
- Third-party logistics provider records
- Shipping management system data
- Carrier's own delivery evidence

The combination of these authoritative third-party sources constitutes reasonable and sufficient commercial proof of package dimensions, absent contradictory evidence from the carrier.

EVIDENCE APPENDICES
-------------------
${appendixReferences}

All appendices are attached to this dispute letter and incorporated by reference.

DISPUTE REQUEST
---------------
Based on the foregoing evidence, we formally request:

1. Immediate reversal of the erroneous adjustment of ${data.claimedAmount}
2. Reinstatement of the original billing amount of ${data.originalAmount}
3. Written confirmation of the adjustment reversal within 15 business days
4. Investigation into the dimensional measurement process that produced the 25% measurement error
5. Corrective action to prevent similar errors on future shipments

APPLICABLE CARRIER POLICIES
----------------------------
Under ${data.carrier}'s published billing policies, invoice disputes must be filed within thirty (30) days from the invoice date and must include the tracking number, invoice details, and supporting evidence. This dispute is filed within the required timeframe and includes comprehensive documentation.

${data.carrier}'s measurement standards require accurate dimensional scanning. The 25% measurement error in this case (4" actual vs. 5" claimed) falls outside any reasonable measurement tolerance and constitutes a billing error subject to correction.

CLOSING
-------
We have provided substantial, authoritative evidence demonstrating that the carrier's dimensional measurement was erroneous. The combination of manufacturer documentation, ShipStation records, 3PL provider data, and the carrier's own delivery photograph showing a cylindrical tube conclusively establishes that the package dimensions were ${data.actualDimensions}, not ${data.carrierDimensions}.

We expect resolution of this dispute within fifteen (15) business days of receipt of this letter. Should you require additional information, please contact ${data.yourName} at ${data.yourEmail} or ${data.yourPhone}.

Sincerely,

${data.yourName}
${data.yourTitle}
${data.companyName}
${data.yourEmail}
${data.yourPhone}

Electronic Timestamp: ${new Date().toISOString()}
Case Reference: ${data.caseNumber}

---
APPENDIX INDEX
${appendices.map(app => `Appendix ${app.letter}: ${app.fileName} (${app.fileType})`).join('\n')}
`;
}

/**
 * Generate dispute letter in Markdown format
 */
export function generateDisputeLetterMarkdown(data: DisputeLetterData): string {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const carrierBillingDepts: Record<string, string> = {
    FEDEX: 'FedEx Billing Department',
    UPS: 'UPS Billing Department',
    USPS: 'USPS Customer Service',
    DHL: 'DHL Billing Department',
    OTHER: 'Billing Department',
  };

  const carrierAddresses: Record<string, string> = {
    FEDEX: 'FedEx Corporate Headquarters, 942 South Shady Grove Road, Memphis, TN 38120',
    UPS: 'UPS Corporate Headquarters, 55 Glenlake Parkway NE, Atlanta, GA 30328',
    USPS: 'United States Postal Service, 475 L\'Enfant Plaza SW, Washington, DC 20260',
    DHL: 'DHL Express USA, 1200 South Pine Island Road, Plantation, FL 33324',
    OTHER: data.carrierLegalAddress || 'Carrier Address',
  };

  const billingDept = data.carrierBillingDept || carrierBillingDepts[data.carrier] || 'Billing Department';
  const legalAddress = data.carrierLegalAddress || carrierAddresses[data.carrier] || 'Carrier Legal Address';

  // Generate appendix references
  const appendices = (data.attachments || []).map((att, index) => ({
    letter: String.fromCharCode(65 + index), // A, B, C, etc.
    fileName: att.fileName,
    fileUrl: att.fileUrl,
    fileType: att.fileType,
  }));

  return `# Formal Dispute of Erroneous Shipping Adjustment

**CTF Group LLC**  
1458 Old Durham Rd. Roxboro, NC - 27573

**Date:** ${today}

**To:** ${billingDept}  
**Legal Address:** ${legalAddress}

**Subject:** Formal Dispute of Erroneous Shipping Adjustment – Tracking ID ${data.trackingId}

---

Dear ${billingDept},

I am writing on behalf of **${data.companyName}** to dispute the billing adjustment applied on ${data.adjustmentDate}, associated with shipment **${data.trackingId}**. The adjustment alleges that the dimensions of the package were ${data.carrierDimensions}, which triggered surcharges including dimensional weight pricing, fuel surcharge, residential delivery, and additional handling fees. However, our authoritative records, manufacturer documentation, and third-party logistics provider data confirm that the package dimensions were **${data.actualDimensions}** and complied with standard shipping specifications.

## BACKGROUND

- **Case Number:** ${data.caseNumber}
- **Service:** ${data.serviceType}
- **Tracking Number:** ${data.trackingId}
- **Original Amount Charged:** ${data.originalAmount}
- **Adjusted Amount:** ${data.adjustedAmount}
- **Disputed Amount:** ${data.claimedAmount}
- **Actual Package Dimensions (Verified):** ${data.actualDimensions}
- **Carrier's Claimed Dimensions (Disputed):** ${data.carrierDimensions}

## FACTUAL BASIS FOR DISPUTE

### 1. AUTHORITATIVE SOURCE DATA
Our shipping management system (ShipStation) serves as our authoritative system of record for all shipments. This system recorded the package dimensions as **${data.actualDimensions}** at the time of shipment creation and label generation (see **Appendix A**: ShipStation shipment details).

### 2. MANUFACTURER DOCUMENTATION
The shipping containers used are standardized products manufactured by Yazoo Mills Inc. The manufacturer's order acknowledgment (**Appendix B**) confirms the standard dimensions of our shipping tubes: 92" x 2" x 2", 92" x 3.18" x 3.18", and 92" x 4" x 4". These are consistent, standardized commercial products with uniform dimensions across all units.

### 3. THIRD-PARTY LOGISTICS PROVIDER
All order fulfillment is executed by our 3PL provider, **Pitman Creek Distribution**, located at 213 Tech Way, Stanford, KY 40484. This professional fulfillment operation maintains strict quality control and dimensional consistency for all shipments.

### 4. CARRIER'S OWN DELIVERY EVIDENCE
The carrier's delivery proof photograph (**Appendix C**) shows the package is a **cylindrical tube**. A cylindrical tube with a 4-inch diameter (10.16 cm) cannot physically have cross-sectional dimensions of 5" x 5" (12.70 cm x 12.70 cm) as claimed by the carrier. This is a mathematical and physical impossibility.

## UNIT CONVERSION ANALYSIS

The carrier's dimensional claim contains a critical measurement error:

**Actual Dimensions (CTF/ShipStation):** 92" x 4" x 4"  
Converted to metric: 233.68 cm x 10.16 cm x 10.16 cm

**Carrier's Claimed Dimensions:** 231.14 cm x 12.70 cm x 12.70 cm  
Converted to inches: ~91" x 5" x 5"

The carrier's claim of 12.70 cm (5 inches) for the cross-sectional dimensions represents a **25% measurement error** compared to the actual 10.16 cm (4 inches). This error pushed the package into a higher dimensional weight bracket, resulting in the erroneous surcharge.

## EVIDENCE APPENDICES

${appendices.map(app => `- **Appendix ${app.letter}:** ${app.fileName}`).join('\n')}

All appendices are attached to this dispute letter and incorporated by reference.

## DISPUTE REQUEST

Based on the foregoing evidence, we formally request:

1. Immediate reversal of the erroneous adjustment of **${data.claimedAmount}**
2. Reinstatement of the original billing amount of **${data.originalAmount}**
3. Written confirmation of the adjustment reversal within 15 business days
4. Investigation into the dimensional measurement process that produced the 25% measurement error
5. Corrective action to prevent similar errors on future shipments

## CLOSING

We have provided substantial, authoritative evidence demonstrating that the carrier's dimensional measurement was erroneous. The combination of manufacturer documentation, ShipStation records, 3PL provider data, and the carrier's own delivery photograph showing a cylindrical tube conclusively establishes that the package dimensions were **${data.actualDimensions}**, not ${data.carrierDimensions}.

We expect resolution of this dispute within fifteen (15) business days of receipt of this letter.

**Contact Information:**  
${data.yourName}  
${data.yourTitle}  
${data.companyName}  
${data.yourEmail}  
${data.yourPhone}

---

**Electronic Timestamp:** ${new Date().toISOString()}  
**Case Reference:** ${data.caseNumber}

---

## APPENDIX INDEX

${appendices.map(app => `**Appendix ${app.letter}:** ${app.fileName} (${app.fileType})\n${app.fileUrl}`).join('\n\n')}
`;
}
