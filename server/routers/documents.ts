import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";
import { generateDisputeLetterMarkdown } from "../services/documentService";
import { generateDisputeLetterDocx } from "../services/wordExportService";
import { AIDisputeWriterService, DisputeLetterOptions } from "../services/aiDisputeWriter";
import { Packer } from "docx";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

export const documentsRouter = router({
  /**
   * Generate dispute letter as PDF
   */
  generateDisputeLetter: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Get case details
      const caseRecord = await db.getCaseById(input.caseId);
      
      if (!caseRecord) {
        throw new Error("Case not found");
      }
      
      // Get all attachments
      const attachments = await db.getCaseAttachments(input.caseId);
      
      // Prepare data for letter generation
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
        yourPhone: '(919) 555-0100', // TODO: Get from user profile
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
      
      // Convert to PDF using manus-md-to-pdf utility
      try {
        await execAsync(`manus-md-to-pdf "${mdPath}" "${pdfPath}"`);
      } catch (error: any) {
        console.error('PDF generation error:', error);
        throw new Error(`Failed to generate PDF: ${error.message}`);
      }
      
      // Read PDF file
      const pdfBuffer = await fs.readFile(pdfPath);
      const pdfBase64 = pdfBuffer.toString('base64');
      
      // Clean up temp files
      await fs.unlink(mdPath).catch(() => {});
      await fs.unlink(pdfPath).catch(() => {});
      
      return {
        success: true,
        fileName: `Dispute-Letter-${caseRecord.caseNumber}.pdf`,
        contentType: 'application/pdf',
        content: pdfBase64,
        generatedAt: new Date().toISOString(),
      };
    }),
    
  /**
   * Get dispute letter preview (markdown)
   */
  previewDisputeLetter: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ input, ctx }) => {
      // Get case details
      const caseRecord = await db.getCaseById(input.caseId);
      
      if (!caseRecord) {
        throw new Error("Case not found");
      }
      
      // Get all attachments
      const attachments = await db.getCaseAttachments(input.caseId);
      
      // Prepare data for letter generation
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
      
      return {
        success: true,
        markdown: markdownContent,
        caseNumber: caseRecord.caseNumber,
      };
    }),
  
  /**
   * Generate dispute letter as Word document (.docx)
   */
  generateDisputeLetterWord: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Get case details
      const caseRecord = await db.getCaseById(input.caseId);
      
      if (!caseRecord) {
        throw new Error("Case not found");
      }
      
      // Get all attachments
      const attachments = await db.getCaseAttachments(input.caseId);
      
      // Prepare data for letter generation
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
        yourName: ctx.user.name || 'Authorized Representative',
        yourTitle: 'Authorized Representative',
        yourEmail: ctx.user.email || 'billing@catchthefever.com',
        yourPhone: '(919) 555-0100',
        notes: caseRecord.notes,
      };
      
      // Generate Word document
      const doc = generateDisputeLetterDocx(letterData);
      
      // Convert to buffer
      const buffer = await Packer.toBuffer(doc);
      
      // Convert buffer to base64 for transmission
      const base64 = buffer.toString('base64');
      
      return {
        success: true,
        fileName: `dispute-letter-${caseRecord.caseNumber}.docx`,
        fileData: base64,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };
    }),
  
  /**
   * Generate AI-powered dispute letter
   */
  generateAILetter: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      tone: z.enum(['professional', 'firm', 'conciliatory']).optional(),
      includeDeadline: z.boolean().optional(),
      includeLegalLanguage: z.boolean().optional(),
      requestExpedited: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const options: DisputeLetterOptions = {
        tone: input.tone,
        includeDeadline: input.includeDeadline,
        includeLegalLanguage: input.includeLegalLanguage,
        requestExpedited: input.requestExpedited,
      };
      
      const letter = await AIDisputeWriterService.generateDisputeLetter(
        input.caseId,
        options
      );
      
      return {
        success: true,
        letter,
      };
    }),
});
