import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";
import { generateDisputeLetterMarkdown } from "../services/documentService";
import { createTicketFromCase } from "../services/zohoDeskService";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import archiver from "archiver";
import { createWriteStream } from "fs";

const execAsync = promisify(exec);

export const fileClaimRouter = router({
  /**
   * File claim via Zoho Desk
   * Creates ticket with dispute letter and all attachments
   */
  fileViaZohoDesk: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Get case details
      const caseRecord = await db.getCaseById(input.caseId);
      
      if (!caseRecord) {
        throw new Error("Case not found");
      }
      
      // Get all attachments
      const attachments = await db.getCaseAttachments(input.caseId);
      
      // Generate dispute letter PDF first
      const letterData = {
        caseNumber: caseRecord.caseNumber,
        trackingId: caseRecord.trackingId,
        carrier: caseRecord.carrier,
        adjustmentDate: new Date(caseRecord.adjustmentDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        originalAmount: `$${(caseRecord.originalAmount / 100).toFixed(2)}`,
        adjustedAmount: `$${(caseRecord.adjustedAmount / 100).toFixed(2)}`,
        claimedAmount: `$${(caseRecord.claimedAmount / 100).toFixed(2)}`,
        actualDimensions: caseRecord.actualDimensions || 'Not specified',
        carrierDimensions: caseRecord.carrierDimensions || 'Not specified',
        serviceType: caseRecord.serviceType || 'Standard Service',
        companyName: 'Catch The Fever Outdoors LLC',
        yourName: ctx.user.name,
        yourTitle: 'Authorized Representative',
        yourEmail: ctx.user.email,
        yourPhone: '(919) 555-0100',
        notes: caseRecord.notes,
        attachments: attachments.map(att => ({
          fileName: att.fileName,
          fileUrl: att.fileUrl,
          fileType: att.fileType,
        })),
      };
      
      // Generate markdown letter
      const markdownContent = generateDisputeLetterMarkdown(letterData);
      
      // Create temp directory for PDF generation
      const tempDir = `/tmp/dispute-letters`;
      await fs.mkdir(tempDir, { recursive: true });
      
      const timestamp = Date.now();
      const mdPath = path.join(tempDir, `dispute-${input.caseId}-${timestamp}.md`);
      const pdfPath = path.join(tempDir, `dispute-${input.caseId}-${timestamp}.pdf`);
      
      // Write markdown to file
      await fs.writeFile(mdPath, markdownContent, 'utf-8');
      
      // Convert to PDF
      try {
        await execAsync(`manus-md-to-pdf "${mdPath}" "${pdfPath}"`);
      } catch (error: any) {
        console.error('PDF generation error:', error);
        throw new Error(`Failed to generate PDF: ${error.message}`);
      }
      
      // Upload PDF to S3 (so Zoho can access it)
      const { storagePut } = await import('../storage');
      const pdfBuffer = await fs.readFile(pdfPath);
      const pdfKey = `case-${input.caseId}/dispute-letter-${timestamp}.pdf`;
      const { url: pdfUrl } = await storagePut(pdfKey, pdfBuffer, 'application/pdf');
      
      // Prepare attachments for Zoho
      const zohoDeskAttachments = [
        { url: pdfUrl, fileName: `Dispute-Letter-${caseRecord.caseNumber}.pdf` },
        ...attachments.map(att => ({ url: att.fileUrl, fileName: att.fileName })),
      ];
      
      // Create Zoho Desk ticket
      const ticket = await createTicketFromCase({
        caseNumber: caseRecord.caseNumber,
        trackingId: caseRecord.trackingId,
        carrier: caseRecord.carrier,
        claimedAmount: caseRecord.claimedAmount / 100,
        customerName: caseRecord.customerName,
        customerEmail: ctx.user.email,
        customerPhone: '(919) 555-0100',
        notes: caseRecord.notes || undefined,
        attachments: zohoDeskAttachments,
      });
      
      // Update case with Zoho ticket info
      await db.updateCase(input.caseId, {
        zohoDeskTicketId: ticket.ticketNumber,
        status: 'FILED',
      });
      
      // Log activity
      await db.createActivityLog({
        caseId: input.caseId,
        userId: ctx.user.id,
        actionType: 'CASE_FILED',
        description: `Case filed via Zoho Desk - Ticket #${ticket.ticketNumber}`,
        metadata: JSON.stringify({
          ticketId: ticket.ticketId,
          ticketNumber: ticket.ticketNumber,
          attachmentCount: zohoDeskAttachments.length,
        }),
      });
      
      // Clean up temp files
      await fs.unlink(mdPath).catch(() => {});
      await fs.unlink(pdfPath).catch(() => {});
      
      return {
        success: true,
        ticketNumber: ticket.ticketNumber,
        ticketId: ticket.ticketId,
        message: `Claim filed successfully! Zoho Desk Ticket #${ticket.ticketNumber}`,
      };
    }),
    
  /**
   * Download claim package as ZIP
   * Includes dispute letter PDF and all evidence files
   */
  downloadPackage: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Get case details
      const caseRecord = await db.getCaseById(input.caseId);
      
      if (!caseRecord) {
        throw new Error("Case not found");
      }
      
      // Get all attachments
      const attachments = await db.getCaseAttachments(input.caseId);
      
      // Generate dispute letter PDF
      const letterData = {
        caseNumber: caseRecord.caseNumber,
        trackingId: caseRecord.trackingId,
        carrier: caseRecord.carrier,
        adjustmentDate: new Date(caseRecord.adjustmentDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        originalAmount: `$${(caseRecord.originalAmount / 100).toFixed(2)}`,
        adjustedAmount: `$${(caseRecord.adjustedAmount / 100).toFixed(2)}`,
        claimedAmount: `$${(caseRecord.claimedAmount / 100).toFixed(2)}`,
        actualDimensions: caseRecord.actualDimensions || 'Not specified',
        carrierDimensions: caseRecord.carrierDimensions || 'Not specified',
        serviceType: caseRecord.serviceType || 'Standard Service',
        companyName: 'Catch The Fever Outdoors LLC',
        yourName: ctx.user.name,
        yourTitle: 'Authorized Representative',
        yourEmail: ctx.user.email,
        yourPhone: '(919) 555-0100',
        notes: caseRecord.notes,
        attachments: attachments.map(att => ({
          fileName: att.fileName,
          fileUrl: att.fileUrl,
          fileType: att.fileType,
        })),
      };
      
      const markdownContent = generateDisputeLetterMarkdown(letterData);
      
      const tempDir = `/tmp/dispute-packages`;
      await fs.mkdir(tempDir, { recursive: true });
      
      const timestamp = Date.now();
      const mdPath = path.join(tempDir, `dispute.md`);
      const pdfPath = path.join(tempDir, `Dispute-Letter-${caseRecord.caseNumber}.pdf`);
      const zipPath = path.join(tempDir, `${caseRecord.caseNumber}-${timestamp}.zip`);
      
      // Write markdown
      await fs.writeFile(mdPath, markdownContent, 'utf-8');
      
      // Convert to PDF
      await execAsync(`manus-md-to-pdf "${mdPath}" "${pdfPath}"`);
      
      // Download all attachments
      const attachmentPaths: string[] = [];
      for (let i = 0; i < attachments.length; i++) {
        const att = attachments[i];
        const response = await fetch(att.fileUrl);
        const buffer = Buffer.from(await response.arrayBuffer());
        const attPath = path.join(tempDir, `Appendix-${String.fromCharCode(65 + i)}-${att.fileName}`);
        await fs.writeFile(attPath, buffer);
        attachmentPaths.push(attPath);
      }
      
      // Create ZIP archive
      await new Promise<void>((resolve, reject) => {
        const output = createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        output.on('close', () => resolve());
        archive.on('error', (err) => reject(err));
        
        archive.pipe(output);
        archive.file(pdfPath, { name: `Dispute-Letter-${caseRecord.caseNumber}.pdf` });
        
        for (let i = 0; i < attachmentPaths.length; i++) {
          const att = attachments[i];
          archive.file(attachmentPaths[i], { 
            name: `Appendix-${String.fromCharCode(65 + i)}-${att.fileName}` 
          });
        }
        
        archive.finalize();
      });
      
      // Read ZIP file
      const zipBuffer = await fs.readFile(zipPath);
      const zipBase64 = zipBuffer.toString('base64');
      
      // Clean up
      await fs.unlink(mdPath).catch(() => {});
      await fs.unlink(pdfPath).catch(() => {});
      for (const attPath of attachmentPaths) {
        await fs.unlink(attPath).catch(() => {});
      }
      await fs.unlink(zipPath).catch(() => {});
      
      return {
        success: true,
        fileName: `${caseRecord.caseNumber}-Dispute-Package.zip`,
        contentType: 'application/zip',
        content: zipBase64,
      };
    }),
    
  /**
   * Get Gmail compose URL for filing claim
   */
  getGmailComposeUrl: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ input }) => {
      const caseRecord = await db.getCaseById(input.caseId);
      
      if (!caseRecord) {
        throw new Error("Case not found");
      }
      
      const carrierEmails: Record<string, string> = {
        FEDEX: 'billing.disputes@fedex.com',
        UPS: 'upsrevenueclaims@ups.com',
        USPS: 'uspsclaims@usps.gov',
        DHL: 'dhl.billing.disputes@dhl.com',
      };
      
      const to = carrierEmails[caseRecord.carrier] || '';
      const subject = `Formal Dispute - ${caseRecord.carrier} - Tracking ${caseRecord.trackingId} - Case ${caseRecord.caseNumber}`;
      const body = `Please find attached our formal dispute letter regarding tracking number ${caseRecord.trackingId}.

Case Number: ${caseRecord.caseNumber}
Disputed Amount: $${(caseRecord.claimedAmount / 100).toFixed(2)}

All supporting evidence is attached as referenced in the dispute letter.

Best regards,
Catch The Fever Outdoors LLC`;
      
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      return {
        url: gmailUrl,
        to,
        subject,
        body,
      };
    }),
});
