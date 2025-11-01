import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Standard box sizes for fishing line products
const STANDARD_BOX_SIZES = [
  { name: "Small Tube", dimensions: "9\" x 2\" x 2\"", lengthIn: 9, widthIn: 2, heightIn: 2, lengthCm: 22.86, widthCm: 5.08, heightCm: 5.08 },
  { name: "Medium Tube (3.45)", dimensions: "9\" x 3.45\" x 3.45\"", lengthIn: 9, widthIn: 3.45, heightIn: 3.45, lengthCm: 22.86, widthCm: 8.76, heightCm: 8.76 },
  { name: "Medium Tube (4\")", dimensions: "9\" x 4\" x 4\"", lengthIn: 9, widthIn: 4, heightIn: 4, lengthCm: 22.86, widthCm: 10.16, heightCm: 10.16 },
  { name: "Large Tube (5\")", dimensions: "9\" x 5\" x 5\"", lengthIn: 9, widthIn: 5, heightIn: 5, lengthCm: 22.86, widthCm: 12.70, heightCm: 12.70, note: "Wholesale only, NOT FedEx" },
  { name: "Extra Large Tube (6\")", dimensions: "9\" x 6\" x 6\"", lengthIn: 9, widthIn: 6, heightIn: 6, lengthCm: 22.86, widthCm: 15.24, heightCm: 15.24, note: "Wholesale only, NOT FedEx" },
];

export const aiReviewRouter = router({
  /**
   * Generate AI expert review for a case
   * Analyzes evidence, checks regulations, provides unbiased assessment
   */
  generateReview: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .mutation(async ({ input }) => {
      // Get case details
      const caseRecord = await db.getCaseById(input.caseId);
      
      if (!caseRecord) {
        throw new Error("Case not found");
      }
      
      // Get all attachments/evidence
      const evidence = await db.getCaseAttachments(input.caseId);
      
      // Prepare context for AI review
      const reviewContext = {
        case: {
          caseNumber: caseRecord.caseNumber,
          trackingId: caseRecord.trackingId,
          carrier: caseRecord.carrier,
          serviceType: caseRecord.serviceType,
          originalAmount: caseRecord.originalAmount / 100,
          adjustedAmount: caseRecord.adjustedAmount / 100,
          claimedAmount: caseRecord.claimedAmount / 100,
          actualDimensions: caseRecord.actualDimensions,
          carrierDimensions: caseRecord.carrierDimensions,
          notes: caseRecord.notes,
          adjustmentDate: caseRecord.adjustmentDate,
        },
        evidence: evidence.map(e => ({
          fileName: e.fileName,
          fileType: e.fileType,
          fileUrl: e.fileUrl,
        })),
      };
      
      // Call OpenAI for expert analysis
      const prompt = `You are an expert shipping dispute consultant with deep knowledge of carrier tariffs, dimensional weight regulations, and shipping law. Provide a completely neutral, unbiased analysis of this case.

**CRITICAL DOMAIN KNOWLEDGE - FISHING LINE TUBE PRODUCTS:**

The shipper (Catch The Fever) sells fishing line in cylindrical tubes. These are TUBES, not boxes.

**Standard Tube Sizes (AUTHORITATIVE):**
${STANDARD_BOX_SIZES.map(s => `- ${s.name}: ${s.dimensions} = ${s.lengthCm.toFixed(2)} x ${s.widthCm.toFixed(2)} x ${s.heightCm.toFixed(2)} cm${s.note ? ` (${s.note})` : ''}`).join('\n')}

**CRITICAL FACTS:**
1. **Tubes are CYLINDRICAL** - they cannot have square cross-sections (e.g., 5" x 5" is physically impossible for a tube)
2. **Unit Conversion:** 1 inch = 2.54 cm EXACTLY
   - 4 inches = 10.16 cm
   - 5 inches = 12.70 cm
3. **ShipStation is the AUTHORITATIVE source** - This is the shipper's system of record, NOT the carrier's claim
4. **Measurement errors matter:** A 1-inch error (4" vs 5") = 25% error = different dimensional weight bracket
5. **Delivery photos showing tubes prove cylindrical shape** - contradicts any square dimension claims

**CASE DETAILS:**
- Carrier: ${caseRecord.carrier}
- Service: ${caseRecord.serviceType}
- Tracking: ${caseRecord.trackingId}
- Original Charge: $${reviewContext.case.originalAmount}
- Adjusted Charge: $${reviewContext.case.adjustedAmount}
- Disputed Amount: $${reviewContext.case.claimedAmount}
- **Shipper's Claimed Dimensions (ShipStation - AUTHORITATIVE):** ${caseRecord.actualDimensions}
- **Carrier's Claimed Dimensions (DISPUTED):** ${caseRecord.carrierDimensions}
- Adjustment Date: ${caseRecord.adjustmentDate}

**CASE NOTES:**
${caseRecord.notes || 'No additional notes'}

**EVIDENCE FILES:**
${evidence.map(e => `- ${e.fileName} (${e.fileType})`).join('\n')}

**YOUR ANALYSIS MUST:**

1. **VERIFY UNIT CONVERSIONS:**
   - Convert carrier's cm measurements to inches
   - Compare to shipper's inch measurements
   - Calculate exact discrepancy percentage
   - Flag if carrier's conversions are mathematically incorrect

2. **CHECK PHYSICAL POSSIBILITY:**
   - If evidence shows cylindrical tube, carrier CANNOT claim square cross-section (e.g., 5" x 5")
   - Tubes have ONE diameter dimension, not two different width/height
   - Flag physically impossible measurements

3. **VALIDATE AGAINST STANDARD SIZES:**
   - Match shipper's dimensions to standard tube sizes above
   - Check if carrier's dimensions match ANY standard size
   - If carrier's dimensions don't match standards, this is strong evidence of error

4. **ASSESS EVIDENCE STRENGTH:**
   - ShipStation data = PRIMARY authoritative source
   - Delivery photos showing tubes = STRONG evidence of shape
   - Carrier's own photos contradicting their measurements = SMOKING GUN

5. **CALCULATE DIMENSIONAL WEIGHT:**
   - For shipper's dimensions: (L x W x H) / 139 for inches
   - For carrier's dimensions: (L x W x H) / 139 for inches
   - Show the exact difference in billable weight

**EXAMPLE ANALYSIS:**
If shipper claims 9" x 4" x 4" (= 22.86 x 10.16 x 10.16 cm) but carrier claims 231.14 x 12.70 x 12.70 cm:
- Carrier's 12.70 cm = 5 inches, NOT 4 inches
- This is a 25% measurement error (4" vs 5")
- A cylindrical tube with 4" diameter CANNOT be 5" x 5" (that's a square box)
- If delivery photo shows tube, carrier's claim is PHYSICALLY IMPOSSIBLE
- This is a STRONG claim, not moderate

Format your response as JSON with this structure:
{
  "claimStrength": "Strong" | "Moderate" | "Weak",
  "confidenceScore": 0-100,
  "summary": "Brief 2-3 sentence summary",
  "unitConversionCheck": "Verify carrier's cm to inch conversions are correct",
  "physicalPossibilityCheck": "Check if carrier's dimensions are physically possible for the product type",
  "standardSizeMatch": "Does shipper's size match a standard? Does carrier's?",
  "regulatoryAnalysis": "Detailed analysis of applicable rules",
  "evidenceEvaluation": "Assessment of evidence quality - emphasize ShipStation as authoritative",
  "dimensionalWeightAnalysis": "Technical analysis with exact calculations",
  "carrierRules": "Carrier-specific tariff provisions",
  "counterarguments": "Potential carrier defenses",
  "recommendedStrategy": "Strategic recommendations",
  "expertOpinion": "Your professional assessment",
  "shouldFile": true | false,
  "probabilityOfSuccess": 0-100,
  "additionalEvidenceNeeded": ["list", "of", "items"],
  "redFlags": ["any", "concerns"]
}`;

      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "You are an expert shipping dispute consultant with deep knowledge of carrier tariffs, dimensional weight regulations, and shipping law. You have expertise in unit conversions, physical measurements, and detecting carrier measurement errors. You understand that ShipStation is the shipper's authoritative system of record. Be brutally honest but mathematically rigorous - check all unit conversions and flag physical impossibilities."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.2, // Lower temperature for more consistent, factual analysis
            response_format: { type: "json_object" }
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`OpenAI API error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        const reviewText = data.choices[0].message.content;
        const review = JSON.parse(reviewText);

        return {
          success: true,
          review,
          generatedAt: new Date().toISOString(),
        };
      } catch (error: any) {
        console.error("AI Review error:", error);
        throw new Error(`Failed to generate AI review: ${error.message}`);
      }
    }),
});
