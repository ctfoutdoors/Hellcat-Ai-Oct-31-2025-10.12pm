# Handoff Instructions for Next Agent

## Context
You are continuing work on the **Hellcat Intelligence Platform**, a CRM system for managing shipping overcharge cases with comprehensive evidence collection.

The previous agent completed foundational work on evidence collection and WooCommerce import features, conducted comprehensive testing with a real FedEx case, and documented all issues found.

## Your Mission
Fix critical blocking issues (P0), implement missing features (P1), and complete end-to-end testing of the case workflow with real data.

---

## CRITICAL: Read These Files First

1. **`/home/ubuntu/hellcat-intelligence/SESSION_NOTES_NOV22.md`**  
   Complete session history, what was built, what was tested, what's broken

2. **`/home/ubuntu/hellcat-intelligence/test_results_nov22.md`**  
   Detailed test results with the real FedEx case (tracking 394733401787)

3. **`/home/ubuntu/hellcat-intelligence/todo.md`**  
   Project TODO list with all pending tasks

---

## Immediate Actions (P0 - DO THESE FIRST)

### 1. Create Missing Database Tables

Execute these SQL statements via `webdev_execute_sql`:

```sql
CREATE TABLE IF NOT EXISTS `legal_references` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `referenceType` varchar(50),
  `citation` varchar(255),
  `title` text,
  `jurisdiction` varchar(100),
  `fullText` text,
  `summary` text,
  `applicableCarriers` json,
  `applicableClaimTypes` json,
  `relevanceScore` decimal(3,2),
  `sourceUrl` varchar(500),
  `sourceDocument` varchar(255),
  `effectiveDate` date,
  `expiryDate` date,
  `usageCount` int DEFAULT 0,
  `lastUsedAt` timestamp,
  `tags` json,
  `isActive` boolean DEFAULT true,
  `createdBy` int,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_legal_refs_active` (`isActive`),
  KEY `idx_legal_refs_relevance` (`relevanceScore`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `carrier_terms` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `carrierId` varchar(50) NOT NULL,
  `version` varchar(50),
  `effectiveDate` date,
  `termsUrl` varchar(500),
  `termsContent` text,
  `changes` text,
  `isActive` boolean DEFAULT true,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_carrier_terms_carrier` (`carrierId`),
  KEY `idx_carrier_terms_active` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. Add Missing tRPC Procedures

Add to `server/routers/cases.ts`:

```typescript
getDocuments: protectedProcedure
  .input(z.object({ caseId: z.number() }))
  .query(async ({ input }) => {
    // TODO: Query case_documents table (create if needed)
    return [];
  }),

generateDocument: protectedProcedure
  .input(z.object({
    caseId: z.number(),
    templateId: z.string().optional(),
    options: z.object({
      includeCertification: z.boolean().optional(),
      includeAttestation: z.boolean().optional(),
      legalReferences: z.array(z.number()).optional(),
      carrierTerms: z.array(z.number()).optional(),
      evidenceFiles: z.array(z.number()).optional(),
    }).optional()
  }))
  .mutation(async ({ input }) => {
    // TODO: Implement PDF generation
    // For now, return placeholder
    return {
      success: true,
      documentUrl: '/placeholder.pdf',
      message: 'Document generation not yet implemented'
    };
  }),
```

### 3. Wire Screenshot Capture Button

Find the "Add Evidence" dialog component (likely in `client/src/pages/cases/[id].tsx` or a separate component file).

Add tRPC mutation:

```typescript
const captureProof = trpc.evidence.captureFedExProof.useMutation({
  onSuccess: (data) => {
    toast.success('Screenshot captured successfully!');
    // Refresh evidence list
  },
  onError: (error) => {
    toast.error(`Failed to capture screenshot: ${error.message}`);
  }
});

// On "Capture Screenshot from Tracking" button click:
const handleCaptureScreenshot = async () => {
  await captureProof.mutateAsync({
    caseId: caseData.id,
    trackingNumber: caseData.trackingNumber,
    carrier: caseData.carrier
  });
};
```

### 4. Wire Generate Document Button

Find the "Generate Document" button and connect it:

```typescript
const generateDoc = trpc.cases.generateDocument.useMutation({
  onSuccess: (data) => {
    toast.success('Document generated!');
    // Download or display PDF
    if (data.documentUrl) {
      window.open(data.documentUrl, '_blank');
    }
  },
  onError: (error) => {
    toast.error(`Failed to generate document: ${error.message}`);
  }
});

// On button click:
const handleGenerateDocument = async () => {
  await generateDoc.mutateAsync({
    caseId: caseData.id,
    options: {
      includeCertification: certificationChecked,
      includeAttestation: attestationChecked,
      legalReferences: selectedLegalRefs,
      carrierTerms: selectedCarrierTerms,
      evidenceFiles: selectedEvidence,
    }
  });
};
```

---

## High Priority Actions (P1 - DO NEXT)

### 5. Implement Document Generation Service

Create `server/services/documentGeneration.ts`:

```typescript
import { storagePut } from '../storage';
import PDFDocument from 'pdfkit';

export async function generateDisputeLetter(options: {
  caseData: any;
  legalReferences: any[];
  carrierTerms: any[];
  evidence: any[];
  includeCertification: boolean;
  includeAttestation: boolean;
}) {
  // Create PDF using pdfkit
  const doc = new PDFDocument();
  const chunks: Buffer[] = [];
  
  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => {});
  
  // Add content to PDF
  doc.fontSize(16).text('Dispute Letter', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Case: ${options.caseData.caseNumber}`);
  doc.text(`Tracking: ${options.caseData.trackingNumber}`);
  doc.text(`Carrier: ${options.caseData.carrier}`);
  doc.text(`Claim Amount: $${options.caseData.claimAmount}`);
  doc.moveDown();
  doc.text(options.caseData.description);
  
  // Add legal references
  if (options.legalReferences.length > 0) {
    doc.moveDown();
    doc.fontSize(14).text('Legal References:');
    options.legalReferences.forEach(ref => {
      doc.fontSize(10).text(`- ${ref.citation}: ${ref.title}`);
    });
  }
  
  // Add certification if requested
  if (options.includeCertification) {
    doc.moveDown();
    doc.fontSize(10).text('I certify that the information provided is true and accurate.');
  }
  
  doc.end();
  
  // Wait for PDF to finish
  const pdfBuffer = await new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
  
  // Upload to S3
  const fileName = `dispute-letter-${options.caseData.id}-${Date.now()}.pdf`;
  const { url } = await storagePut(
    `case-documents/${fileName}`,
    pdfBuffer,
    'application/pdf'
  );
  
  return { url, fileName };
}
```

Install pdfkit if needed:
```bash
cd /home/ubuntu/hellcat-intelligence && pnpm add pdfkit @types/pdfkit
```

### 6. Test Email Workflow

Send test email:
```
From: herve@catchthefever.com
To: herve@catchthefever.com
Subject: FedEx Overcharge - Tracking 394733401787
Body: 
FedEx charged $94.54 instead of $16.55 for tracking 394733401787.
Dimensional weight discrepancy.
```

Verify:
- Email detected by monitoring system
- Case auto-created
- Tracking number extracted
- Case linked to email

### 7. Implement FedEx Tracking Data Collection

Create `server/services/fedexTracking.ts`:

```typescript
export async function fetchFedExTrackingData(trackingNumber: string) {
  // Use FedEx API or web scraping to get:
  // - Complete tracking timeline
  // - All scan events with timestamps
  // - Facility locations
  // - Delivery proof photos
  
  // Store in tracking_events table
  // Store photos in delivery_proofs table
  
  return {
    events: [],
    deliveryProof: null,
    route: []
  };
}
```

### 8. Implement Location Intelligence

Create `server/services/locationIntelligence.ts`:

```typescript
export async function geocodeAndVerifyLocation(address: string, facilityName: string) {
  // 1. Geocode address using Google Maps API
  // 2. Cross-reference with public databases
  // 3. Assign confidence label:
  //    - "Known": Confirmed facility with verified address
  //    - "Suspected": Probable location based on partial data
  //    - "Unverified": Location data exists but cannot confirm
  
  // 4. Cite sources
  // 5. Store in facility_locations table
  
  return {
    latitude: 0,
    longitude: 0,
    confidence: 'Known',
    sources: [],
    verifiedAt: new Date()
  };
}
```

---

## Testing Checklist

Use the real FedEx case for all testing:
- **Tracking**: 394733401787
- **Carrier**: FedEx 2Day® One Rate
- **Overcharge**: $77.99
- **Case Number**: CASE-1763825164911

### Test Every Button:
- [ ] Add Evidence → Opens dialog
- [ ] Capture Screenshot from Tracking → Captures FedEx proof
- [ ] Upload Files → Uploads evidence
- [ ] AI Review → Shows case analysis
- [ ] Generate Document → Creates PDF
- [ ] Generate & Send to ShipStation → Sends email
- [ ] Update Status → Changes status, logs activity
- [ ] Add Note → Saves note to database

### Test Every Workflow:
- [ ] Create case manually
- [ ] Create case from email
- [ ] Capture delivery proof screenshot
- [ ] Generate dispute letter PDF
- [ ] Update case status
- [ ] Add notes and comments
- [ ] View activity timeline
- [ ] Send complaint email

### Verify No Errors:
- [ ] No console errors
- [ ] No 500 database errors
- [ ] No TypeScript compilation errors
- [ ] All data saves correctly
- [ ] All queries return data

---

## Important Files

### Backend
- `server/routers/cases.ts` - Case management endpoints
- `server/routers/evidence.ts` - Evidence collection endpoints
- `server/services/fedexScreenshotCapture.ts` - Screenshot capture
- `server/db/evidence.ts` - Evidence database helpers

### Frontend
- Look for case detail page (likely `client/src/pages/cases/[id].tsx`)
- Add Evidence dialog component
- Generate Document button location

### Database
- All tables created except `legal_references` and `carrier_terms`
- Schema defined in `drizzle/schema.ts`

---

## Success Criteria

Before marking this task complete:

1. ✅ All P0 issues fixed (buttons wired, tables created)
2. ✅ Screenshot capture working with real FedEx tracking
3. ✅ Document generation creates actual PDF
4. ✅ Email workflow tested and working
5. ✅ No console errors on case detail page
6. ✅ All test cases pass
7. ✅ Checkpoint saved and pushed to GitHub

---

## Prompt to Start Next Session

```
Continue work on Hellcat Intelligence Platform case workflow.

CRITICAL: First read these files:
1. /home/ubuntu/hellcat-intelligence/SESSION_NOTES_NOV22.md
2. /home/ubuntu/hellcat-intelligence/HANDOFF_TO_NEXT_AGENT.md
3. /home/ubuntu/hellcat-intelligence/test_results_nov22.md

Previous agent completed:
- Evidence collection system foundation
- WooCommerce import enhancements
- Comprehensive testing with real FedEx case
- Documented all issues with priorities

Your tasks (in order):
1. Create missing database tables (legal_references, carrier_terms)
2. Add missing tRPC procedures (getDocuments, generateDocument)
3. Wire screenshot capture button to backend
4. Wire generate document button to backend
5. Test everything with real FedEx case (tracking 394733401787)
6. Implement document generation service
7. Test email workflow
8. Save checkpoint and push to GitHub

Use the real FedEx overcharge case for all testing:
- Tracking: 394733401787
- Carrier: FedEx
- Overcharge: $77.99
- Case: CASE-1763825164911

Test every button, every workflow. No exceptions. Everything must work.
```

---

## Contact Info

**User**: Hervé  
**Email**: herve@catchthefever.com  
**GitHub**: ctfoutdoors/Hellcat-Ai-Oct-31-2025-10.12pm

---

Good luck! The foundation is solid, just needs the final wiring and testing.
