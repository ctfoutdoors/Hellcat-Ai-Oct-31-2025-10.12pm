import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { createShipStationClient } from "../integrations/shipstation";
import { storagePut } from "../storage";
import { parseClaimDocument, extractTextFromDocument } from "../services/documentParser";
import { generateDisputeLetter, generateFollowUpEmail } from "../services/documentGenerator";
import { scheduleFollowUps, cancelFollowUps, getScheduledFollowups } from "../services/followupScheduler";
import { calculateSuccessProbability } from "../services/successProbabilityCalculator";

export const casesRouter = router({
  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      caseType: z.string().optional(),
      carrier: z.string().optional(),
      searchTerm: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      return await db.listCases({
        ...input,
        userId: ctx.user.id,
      });
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getCaseById(input.id);
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string(),
      description: z.string().optional(),
      caseType: z.string(),
      carrier: z.string().optional(),
      trackingNumber: z.string().optional(),
      claimAmount: z.string().optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
      customerName: z.string().optional(),
      customerEmail: z.string().optional(),
      customerPhone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const caseNumber = `CASE-${Date.now()}`;
      return await db.createCase({
        ...input,
        caseNumber,
        createdBy: ctx.user.id,
      });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      carrier: z.string().optional(),
      trackingNumber: z.string().optional(),
      claimAmount: z.number().optional(),
      priority: z.string().optional(),
      caseType: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      const dbUpdates: any = { ...updates };
      if (updates.claimAmount !== undefined) {
        dbUpdates.claimAmount = updates.claimAmount.toString();
      }
      return await db.updateCase(id, dbUpdates);
    }),

  flag: protectedProcedure
    .input(z.object({
      id: z.number(),
      reason: z.string(),
    }))
    .mutation(async ({ input }) => {
      return await db.flagCase(input.id, input.reason);
    }),

  unflag: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      return await db.unflagCase(input.id);
    }),

  getFlagged: protectedProcedure
    .query(async () => {
      return await db.getFlaggedCases();
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.addCaseActivity({
        caseId: input.id,
        activityType: "status_change",
        description: `Status changed to ${input.status}`,
        performedBy: ctx.user.id,
      });
      return await db.updateCaseStatus(input.id, input.status);
    }),

  /**
   * Import cases from ShipStation
   * Fetches orders with delivery exceptions and creates cases automatically
   */
  importFromShipStation: protectedProcedure
    .input(z.object({
      daysBack: z.number().optional().default(30),
      exceptionTypes: z.array(z.enum(['late_delivery', 'no_tracking', 'missing_delivery_date'])).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const client = createShipStationClient();
      if (!client) {
        throw new Error('ShipStation API credentials not configured');
      }

      // Detect exceptions from ShipStation
      const exceptions = await client.detectExceptions(input.daysBack);

      // Filter by exception types if specified
      let filteredExceptions = exceptions;
      if (input.exceptionTypes && input.exceptionTypes.length > 0) {
        filteredExceptions = exceptions.filter(ex => 
          input.exceptionTypes!.includes(ex.exceptionType)
        );
      }

      const imported: any[] = [];
      const skipped: any[] = [];
      const errors: any[] = [];

      for (const exception of filteredExceptions) {
        try {
          const { order, exceptionType, severity } = exception;

          // Check if case already exists for this tracking number
          if (order.trackingNumber) {
            const existingCases = await db.listCases({
              searchTerm: order.trackingNumber,
              userId: ctx.user.id,
            });

            if (existingCases && existingCases.length > 0) {
              skipped.push({
                orderNumber: order.orderNumber,
                trackingNumber: order.trackingNumber,
                reason: 'Case already exists',
              });
              continue;
            }
          }

          // Create case from exception
          const caseNumber = `CASE-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          
          const caseData = {
            caseNumber,
            title: `${exceptionType.replace(/_/g, ' ').toUpperCase()}: Order ${order.orderNumber}`,
            description: `Automatically imported from ShipStation. Exception type: ${exceptionType}. Severity: ${severity}.`,
            caseType: exceptionType,
            carrier: order.carrierCode || 'unknown',
            trackingNumber: order.trackingNumber || undefined,
            claimAmount: order.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0).toString(),
            priority: severity === 'high' ? 'urgent' : severity === 'medium' ? 'high' : 'medium',
            customerName: order.shipTo?.name || undefined,
            customerEmail: order.customerEmail || undefined,
            shippingAddress1: order.shipTo?.street1 || undefined,
            shippingCity: order.shipTo?.city || undefined,
            shippingState: order.shipTo?.state || undefined,
            shippingZip: order.shipTo?.postalCode || undefined,
            shippingCountry: order.shipTo?.country || undefined,
            createdBy: ctx.user.id,
          };

          const newCase = await db.createCase(caseData);

          // Add activity log
          await db.addCaseActivity({
            caseId: newCase.id,
            activityType: 'import',
            description: `Case imported from ShipStation (Order: ${order.orderNumber}, Exception: ${exceptionType})`,
            performedBy: ctx.user.id,
          });

          imported.push({
            caseId: newCase.id,
            caseNumber: newCase.caseNumber,
            orderNumber: order.orderNumber,
            trackingNumber: order.trackingNumber,
            exceptionType,
          });

        } catch (error: any) {
          errors.push({
            orderNumber: exception.order.orderNumber,
            error: error.message,
          });
        }
      }

      return {
        success: true,
        total: filteredExceptions.length,
        imported: imported.length,
        skipped: skipped.length,
        errors: errors.length,
        details: {
          imported,
          skipped,
          errors,
        },
      };
    }),

  /**
   * Upload files (screenshots/documents) for a case
   * Files are stored in S3 and linked to the case
   */
  uploadFiles: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      files: z.array(z.object({
        fileName: z.string(),
        fileType: z.string(),
        fileData: z.string(), // base64 encoded
        fileSize: z.number(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const uploadedFiles: any[] = [];
      const errors: any[] = [];

      for (const file of input.files) {
        try {
          // Decode base64 file data
          const buffer = Buffer.from(file.fileData, 'base64');

          // Generate unique file key
          const timestamp = Date.now();
          const randomSuffix = Math.random().toString(36).substring(7);
          const fileExtension = file.fileName.split('.').pop();
          const fileKey = `cases/${input.caseId}/${timestamp}-${randomSuffix}.${fileExtension}`;

          // Upload to S3
          const { url } = await storagePut(fileKey, buffer, file.fileType);

          // Save file metadata to database
          const fileRecord = await db.addCaseAttachment({
            caseId: input.caseId,
            fileName: file.fileName,
            fileType: file.fileType,
            fileSize: file.fileSize,
            fileUrl: url,
            uploadedBy: ctx.user.id,
          });

          uploadedFiles.push({
            id: fileRecord.id,
            fileName: file.fileName,
            fileUrl: url,
          });

          // Add activity log
          await db.addCaseActivity({
            caseId: input.caseId,
            activityType: 'file_upload',
            description: `Uploaded file: ${file.fileName}`,
            performedBy: ctx.user.id,
          });

        } catch (error: any) {
          errors.push({
            fileName: file.fileName,
            error: error.message,
          });
        }
      }

      return {
        success: true,
        uploaded: uploadedFiles.length,
        failed: errors.length,
        files: uploadedFiles,
        errors,
      };
    }),

  /**
   * Parse document with AI to extract claim details
   * Analyzes uploaded document and returns structured claim data
   */
  parseDocument: protectedProcedure
    .input(z.object({
      fileData: z.string(), // base64
      fileName: z.string(),
      fileType: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Extract text from document
        const extractedText = await extractTextFromDocument(
          input.fileData,
          input.fileType,
          input.fileName
        );

        // If extraction failed or not supported, return empty result
        if (extractedText.startsWith("[")) {
          return {
            success: false,
            message: extractedText,
            data: null,
          };
        }

        // Parse with AI
        const parsedData = await parseClaimDocument(extractedText, input.fileName);

        return {
          success: true,
          data: parsedData,
        };
      } catch (error: any) {
        console.error("[Cases] Document parsing failed:", error);
        return {
          success: false,
          message: error.message || "Failed to parse document",
          data: null,
        };
      }
    }),

  /**
   * Get all files attached to a case
   */
  getFiles: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ input }) => {
      return await db.getCaseAttachments(input.caseId);
    }),

  /**
   * Import cases from CSV file
   * Expects CSV with columns: title, description, caseType, carrier, trackingNumber, claimAmount, priority, customerName, customerEmail, customerPhone
   */
  importFromCSV: protectedProcedure
    .input(z.object({
      csvData: z.string(), // CSV content as string
    }))
    .mutation(async ({ ctx, input }) => {
      const imported: any[] = [];
      const skipped: any[] = [];
      const errors: any[] = [];

      try {
        // Parse CSV (simple implementation - assumes comma-separated, first row is header)
        const lines = input.csvData.trim().split('\n');
        if (lines.length < 2) {
          throw new Error('CSV file is empty or has no data rows');
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const dataLines = lines.slice(1);

        // Validate required columns
        const requiredColumns = ['title', 'casetype'];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));
        if (missingColumns.length > 0) {
          throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
        }

        for (let i = 0; i < dataLines.length; i++) {
          const line = dataLines[i].trim();
          if (!line) continue; // Skip empty lines

          try {
            const values = line.split(',').map(v => v.trim());
            const row: Record<string, string> = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });

            // Check if case already exists by tracking number (if provided)
            if (row.trackingnumber) {
              const existingCases = await db.listCases({
                searchTerm: row.trackingnumber,
                userId: ctx.user.id,
              });

              if (existingCases && existingCases.length > 0) {
                skipped.push({
                  row: i + 2, // +2 because: 1 for header, 1 for 0-index
                  title: row.title,
                  reason: 'Case with this tracking number already exists',
                });
                continue;
              }
            }

            // Create case from CSV row
            const caseNumber = `CASE-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            
            const caseData = {
              caseNumber,
              title: row.title || 'Untitled Case',
              description: row.description || undefined,
              caseType: row.casetype,
              carrier: row.carrier || undefined,
              trackingNumber: row.trackingnumber || undefined,
              claimAmount: row.claimamount || undefined,
              priority: (row.priority as any) || 'medium',
              customerName: row.customername || undefined,
              customerEmail: row.customeremail || undefined,
              customerPhone: row.customerphone || undefined,
              createdBy: ctx.user.id,
            };

            const newCase = await db.createCase(caseData);

            // Add activity log
            await db.addCaseActivity({
              caseId: newCase.id,
              activityType: 'import',
              description: `Case imported from CSV (row ${i + 2})`,
              performedBy: ctx.user.id,
            });

            imported.push({
              row: i + 2,
              caseId: newCase.id,
              caseNumber: newCase.caseNumber,
              title: newCase.title,
            });

          } catch (error: any) {
            errors.push({
              row: i + 2,
              error: error.message,
            });
          }
        }

        return {
          success: true,
          total: dataLines.length,
          imported: imported.length,
          skipped: skipped.length,
          errors: errors.length,
          details: {
            imported,
            skipped,
            errors,
          },
        };

      } catch (error: any) {
        throw new Error(`CSV parsing error: ${error.message}`);
      }
    }),

  /**
   * Generate dispute letter PDF for a case
   * Uses AI to create professional dispute letter content
   */
  generateDisputeLetter: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const caseData = await db.getCaseById(input.caseId);
      if (!caseData) {
        throw new Error('Case not found');
      }

      // Generate PDF
      const pdfBuffer = await generateDisputeLetter({
        caseNumber: caseData.caseNumber,
        title: caseData.title,
        description: caseData.description || undefined,
        carrier: caseData.carrier || 'Unknown Carrier',
        trackingNumber: caseData.trackingNumber || undefined,
        claimAmount: caseData.claimAmount || undefined,
        customerName: caseData.customerName || undefined,
        customerEmail: caseData.customerEmail || undefined,
      });

      // Upload to S3
      const timestamp = Date.now();
      const fileKey = `cases/${input.caseId}/dispute-letter-${timestamp}.pdf`;
      const { url } = await storagePut(fileKey, pdfBuffer, 'application/pdf');

      // Save to database as attachment
      await db.addCaseAttachment({
        caseId: input.caseId,
        fileName: `Dispute Letter - ${caseData.caseNumber}.pdf`,
        fileType: 'application/pdf',
        fileSize: pdfBuffer.length,
        fileUrl: url,
        uploadedBy: ctx.user.id,
      });

      // Add activity log
      await db.addCaseActivity({
        caseId: input.caseId,
        activityType: 'document_generated',
        description: 'Generated dispute letter PDF',
        performedBy: ctx.user.id,
      });

      return {
        success: true,
        fileUrl: url,
        fileName: `Dispute Letter - ${caseData.caseNumber}.pdf`,
      };
    }),

  /**
   * Generate follow-up email template for a case
   * Uses AI to create professional follow-up email content
   */
  generateFollowUpEmail: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .mutation(async ({ input }) => {
      const caseData = await db.getCaseById(input.caseId);
      if (!caseData) {
        throw new Error('Case not found');
      }

      const emailTemplate = await generateFollowUpEmail({
        caseNumber: caseData.caseNumber,
        title: caseData.title,
        description: caseData.description || undefined,
        carrier: caseData.carrier || 'Unknown Carrier',
        trackingNumber: caseData.trackingNumber || undefined,
        claimAmount: caseData.claimAmount || undefined,
      });

      return {
        success: true,
        subject: emailTemplate.subject,
        body: emailTemplate.body,
      };
    }),

  /**
   * Send follow-up email for a case
   * Sends email via Gmail and logs it in the database
   */
  sendFollowUpEmail: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      to: z.string().email(),
      subject: z.string(),
      body: z.string(),
      attachmentUrls: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Send email via Gmail MCP
        const { sendEmailViaGmail } = await import('../integrations/gmail-send');
        await sendEmailViaGmail({
          to: [input.to],
          subject: input.subject,
          content: input.body,
        });

        // Log email in database
        await db.addCaseActivity({
          caseId: input.caseId,
          activityType: 'email_sent',
          description: `Sent follow-up email to ${input.to}: ${input.subject}`,
          performedBy: ctx.user.id,
        });

        return {
          success: true,
          message: 'Follow-up email sent successfully',
        };
      } catch (error: any) {
        throw new Error(`Failed to send email: ${error.message}`);
      }
    }),

  /**
   * Schedule automatic follow-up emails for a case
   * Creates 3, 7, and 14-day follow-ups
   */
  scheduleFollowUps: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      recipientEmail: z.string().email(),
    }))
    .mutation(async ({ ctx, input }) => {
      const caseData = await db.getCaseById(input.caseId);
      if (!caseData) {
        throw new Error('Case not found');
      }

      const scheduled = await scheduleFollowUps({
        caseId: input.caseId,
        recipientEmail: input.recipientEmail,
        caseNumber: caseData.caseNumber,
        title: caseData.title,
        carrier: caseData.carrier || 'Unknown',
        trackingNumber: caseData.trackingNumber || undefined,
        createdBy: ctx.user.id,
      });

      // Add activity log
      await db.addCaseActivity({
        caseId: input.caseId,
        activityType: 'followup_scheduled',
        description: `Scheduled ${scheduled.length} automatic follow-up emails`,
        performedBy: ctx.user.id,
      });

      return {
        success: true,
        scheduled,
      };
    }),

  /**
   * Get scheduled follow-ups for a case
   */
  getScheduledFollowUps: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ input }) => {
      return await getScheduledFollowups(input.caseId);
    }),

  /**
   * Cancel scheduled follow-ups for a case
   */
  cancelFollowUps: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await cancelFollowUps(input.caseId);

      // Add activity log
      await db.addCaseActivity({
        caseId: input.caseId,
        activityType: 'followup_cancelled',
        description: 'Cancelled scheduled follow-up emails',
        performedBy: ctx.user.id,
      });

      return { success: true };
    }),

  /**
   * Calculate AI success probability for a case
   */
  calculateSuccessProbability: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .mutation(async ({ input }) => {
      const caseData = await db.getCaseById(input.caseId);
      if (!caseData) {
        throw new Error('Case not found');
      }

      const result = await calculateSuccessProbability({
        title: caseData.title,
        description: caseData.description || undefined,
        caseType: caseData.caseType,
        carrier: caseData.carrier || 'Unknown',
        trackingNumber: caseData.trackingNumber || undefined,
        claimAmount: caseData.claimAmount || undefined,
        priority: caseData.priority || undefined,
        customerName: caseData.customerName || undefined,
      });

      // Update case with calculated probability
      await db.updateCase(input.caseId, {
        aiSuccessProbability: result.probability,
        aiRecommendation: result.recommendations.join('\n'),
      });

      return {
        success: true,
        ...result,
      };
    }),
});





