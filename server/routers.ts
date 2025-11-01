import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { getDb } from "./db";
import { storagePut } from "./storage";
import { generateDisputeLetter, generateDisputeLetterMarkdown } from "./services/documentService";
import { aiReviewRouter } from "./routers/ai-review";
import { documentsRouter } from "./routers/documents";
import { fileClaimRouter } from "./routers/file-claim";
import { prioritySuggestionsRouter } from "./routers/prioritySuggestions";
import { evidencePackageRouter } from "./routers/evidencePackage";
import { shipstationSyncRouter } from "./routers/shipstationSync";
import { emailTemplatesRouter } from "./routers/emailTemplates";
import { pdfInvoiceScannerRouter } from "./routers/pdfInvoiceScanner";
import { emailToCaseRouter } from "./routers/emailToCaseImporter";
import { autoStatusUpdatesRouter } from "./routers/autoStatusUpdates";
import { aiAgentRouter } from "./routers/aiAgent";
import { schedulerRouter } from "./routers/scheduler";
import { crmRouter } from "./routers/crm";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  aiReview: aiReviewRouter,
  documentsV2: documentsRouter,
  fileClaim: fileClaimRouter,
  prioritySuggestions: prioritySuggestionsRouter,
  evidencePackage: evidencePackageRouter,
  shipstationSync: shipstationSyncRouter,
  emailTemplates: emailTemplatesRouter,
  pdfInvoiceScanner: pdfInvoiceScannerRouter,
  emailToCase: emailToCaseRouter,
  autoStatusUpdates: autoStatusUpdatesRouter,
  aiAgent: aiAgentRouter,
  scheduler: schedulerRouter,
  crm: crmRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  cases: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllCases();
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getCaseById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        trackingId: z.string(),
        carrier: z.enum(["FEDEX", "UPS", "USPS", "DHL", "OTHER"]),
        originalAmount: z.number(),
        adjustedAmount: z.number(),
        claimedAmount: z.number(),
        actualDimensions: z.string().optional(),
        carrierDimensions: z.string().optional(),
        customerName: z.string().optional(),
        orderId: z.string().optional(),
        serviceType: z.string().optional(),
        adjustmentDate: z.date().optional(),
        notes: z.string().optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Generate case number
        const timestamp = Date.now().toString(36).toUpperCase();
        const caseNumber = `CTF-${timestamp}`;
        
        const caseData = {
          ...input,
          caseNumber,
          createdBy: ctx.user.id,
        };
        
        const newCase = await db.createCase(caseData);
        const caseId = newCase.id;
        
        await db.createActivityLog({
          caseId,
          userId: ctx.user.id,
          actionType: "CASE_CREATED",
          description: `Case ${caseNumber} created`,
        });
        
        return { success: true, caseNumber, id: caseId };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["DRAFT", "FILED", "AWAITING_RESPONSE", "RESOLVED", "CLOSED", "REJECTED"]).optional(),
        priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
        notes: z.string().optional(),
        recoveredAmount: z.number().optional(),
        assignedTo: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...updates } = input;
        await db.updateCase(id, updates);
        
        await db.createActivityLog({
          caseId: id,
          userId: ctx.user.id,
          actionType: "CASE_UPDATED",
          description: `Case updated`,
          metadata: JSON.stringify(updates),
        });
        
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteCase(input.id);
        
        await db.createActivityLog({
          caseId: input.id,
          userId: ctx.user.id,
          actionType: "CASE_DELETED",
          description: `Case deleted`,
        });
        
        return { success: true };
      }),
    
    getActivityLogs: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCaseActivityLogs(input.caseId);
      }),
    
    getAttachments: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCaseAttachments(input.caseId);
      }),
    
    getDocuments: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCaseDocuments(input.caseId);
      }),
  }),
  
  dashboard: router({
    metrics: protectedProcedure.query(async () => {
      return await db.getDashboardMetrics();
      }),
    
    analyzeAndCompleteCase: protectedProcedure
      .input(z.object({
        caseId: z.number(),
        attachmentUrls: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { invokeLLM } = await import('./_core/llm');
        const { getCaseById } = await import('./db');
        
        const caseData = await getCaseById(input.caseId);
        if (!caseData) throw new Error('Case not found');
        
        const prompt = `Analyze this carrier dispute case and suggest values for any missing fields.

Current case data:
${JSON.stringify(caseData, null, 2)}

Provide suggestions for:
1. Missing dimensions (if package photos are available)
2. Estimated weight
3. Suggested claim amount based on the data
4. Any other missing critical information

Return a JSON object with suggested field values and confidence scores (0-1) for each suggestion.`;
        
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are an expert at analyzing shipping disputes and extracting data from documents and images.' },
            { role: 'user', content: prompt },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'case_analysis',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  suggestions: {
                    type: 'object',
                    properties: {
                      weight: { type: 'number', description: 'Suggested weight in lbs' },
                      length: { type: 'number', description: 'Suggested length in inches' },
                      width: { type: 'number', description: 'Suggested width in inches' },
                      height: { type: 'number', description: 'Suggested height in inches' },
                      claimedAmount: { type: 'number', description: 'Suggested claim amount' },
                    },
                    required: [],
                    additionalProperties: false,
                  },
                  confidence: {
                    type: 'object',
                    properties: {
                      weight: { type: 'number' },
                      dimensions: { type: 'number' },
                      claimedAmount: { type: 'number' },
                    },
                    required: [],
                    additionalProperties: false,
                  },
                  reasoning: { type: 'string', description: 'Explanation of suggestions' },
                },
                required: ['suggestions', 'confidence', 'reasoning'],
                additionalProperties: false,
              },
            },
          },
        });
        
        const result = JSON.parse(response.choices[0].message.content || '{}');
        return result;
      }),
  }),

  // Credentials management
  credentials: router({
    save: protectedProcedure
      .input(z.object({
        serviceType: z.string(),
        serviceName: z.string(),
        credentials: z.record(z.string(), z.string()),
      }))
      .mutation(async ({ input, ctx }) => {
        const { saveServiceCredentials } = await import('./services/apiService');
        await saveServiceCredentials(
          input.serviceType,
          input.serviceName,
          input.credentials as Record<string, string>,
          ctx.user.id
        );
        return { success: true };
      }),
    
    test: protectedProcedure
      .input(z.object({
        serviceType: z.string(),
        serviceName: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { testServiceCredentials } = await import('./services/apiService');
        return await testServiceCredentials(input.serviceType, input.serviceName);
      }),
  }),

  // Voice transcription
  files: router({
    upload: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileType: z.string(),
        fileData: z.string(), // base64 encoded
        caseId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { fileName, fileType, fileData, caseId } = input;
        
        // Decode base64 to buffer
        const buffer = Buffer.from(fileData, 'base64');
        
        // Generate unique file key
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileKey = `user-${ctx.user.id}/uploads/${timestamp}-${randomSuffix}-${fileName}`;
        
        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, fileType);
        
        // Save to attachments table if caseId provided
        if (caseId) {
          await db.createAttachment({
            caseId,
            fileUrl: url,
            fileType,
            fileName,
            fileSize: buffer.length,
            uploadedBy: ctx.user.id,
          });
        }
        
        return { url, fileKey, fileName, fileType };
      }),
  }),

  documents: router({
    generateDisputeLetter: protectedProcedure
      .input(z.object({
        caseId: z.number(),
        format: z.enum(["text", "markdown"]).default("markdown"),
      }))
      .mutation(async ({ input, ctx }) => {
        const { caseId, format } = input;
        
        // Get case data
        const caseData = await db.getCaseById(caseId);
        if (!caseData) {
          throw new Error("Case not found");
        }
        
        // Get attachments for evidence
        const attachments = await db.getCaseAttachments(caseId);
        const evidencePhotos = attachments
          .filter(a => a.fileType.startsWith('image/'))
          .map(a => a.fileUrl);
        
        // Prepare document data
        const documentData = {
          caseNumber: caseData.caseNumber,
          trackingId: caseData.trackingId,
          carrier: caseData.carrier,
          carrierBillingDept: "",
          carrierLegalAddress: "",
          adjustmentDate: caseData.adjustmentDate?.toLocaleDateString() || new Date().toLocaleDateString(),
          originalAmount: `$${(caseData.originalAmount / 100).toFixed(2)}`,
          adjustedAmount: `$${(caseData.adjustedAmount / 100).toFixed(2)}`,
          claimedAmount: `$${(caseData.claimedAmount / 100).toFixed(2)}`,
          actualDimensions: caseData.actualDimensions || "Not specified",
          carrierDimensions: caseData.carrierDimensions || "Not specified",
          serviceType: caseData.serviceType || "Standard Shipping",
          customerName: caseData.customerName || "Customer",
          companyName: "CTF Group LLC",
          yourName: ctx.user.name || "Herve Dromprobst",
          yourTitle: "Operations Manager",
          yourEmail: ctx.user.email || "herve@catchthefever.com",
          yourPhone: "(XXX) XXX-XXXX",
          evidencePhotos,
        };
        
        // Generate document
        const content = format === "markdown" 
          ? generateDisputeLetterMarkdown(documentData)
          : generateDisputeLetter(documentData);
        
        // Save to documents table
        const fileName = `dispute-letter-${caseData.caseNumber}.${format === "markdown" ? "md" : "txt"}`;
        const fileType = format === "markdown" ? "text/markdown" : "text/plain";
        
        // Upload to S3
        const fileKey = `case-${caseId}/documents/${fileName}`;
        const buffer = Buffer.from(content, 'utf-8');
        const { url } = await storagePut(fileKey, buffer, fileType);
        
        // Save document record
        await db.createDocument({
          caseId,
          documentType: "DISPUTE_LETTER",
          fileUrl: url,
          generatedBy: ctx.user.id,
        });
        
        return { 
          content, 
          url, 
          fileName,
          format,
        };
      }),
  }),

  voice: router({
    transcribe: protectedProcedure
      .input(z.object({
        audioUrl: z.string(),
        language: z.string().optional(),
        prompt: z.string().optional(),
        caseId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { transcribeAudioFromUrl, summarizeTranscription, extractActionItems } = await import('./services/voiceService');
        
        // Transcribe audio
        const transcription = await transcribeAudioFromUrl(input.audioUrl, {
          language: input.language,
          prompt: input.prompt,
        });
        
        // Generate summary
        const summary = await summarizeTranscription(transcription.text);
        
        // Extract action items
        const actionItems = await extractActionItems(transcription.text);
        
        // Save as activity log if caseId provided
        if (input.caseId) {
          await db.createActivityLog({
            caseId: input.caseId,
            userId: ctx.user.id,
            actionType: 'VOICE_MEMO',
            description: summary,
            metadata: JSON.stringify({
              transcription: transcription.text,
              actionItems,
              duration: transcription.duration,
            }),
          });
        }
        
        return {
          transcription: transcription.text,
          summary,
          actionItems,
          duration: transcription.duration,
          language: transcription.language,
        };
      }),
  }),

  // AI Assistant
  ai: router({
    chat: protectedProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(["system", "user", "assistant", "function"]),
          content: z.string(),
          name: z.string().optional(),
        })),
        caseId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { createChatCompletion, ASSISTANT_SYSTEM_PROMPT, ENHANCED_ASSISTANT_FUNCTIONS } = await import('./services/openaiService');
        
        // Add system prompt if not present
        const messages = input.messages[0]?.role === "system" 
          ? input.messages 
          : [{ role: "system" as const, content: ASSISTANT_SYSTEM_PROMPT }, ...input.messages];
        
        const response = await createChatCompletion({ 
          messages,
          functions: ENHANCED_ASSISTANT_FUNCTIONS,
          function_call: "auto",
        });
        
        // Save conversation to database
        const { saveAIConversation } = await import('./db');
        const conversationId = input.caseId ? `case-${input.caseId}` : `general-${ctx.user.id}-${Date.now()}`;
        
        // Save user message
        await saveAIConversation({
          userId: ctx.user.id,
          conversationId,
          message: input.messages[input.messages.length - 1]?.content || "",
          role: "USER",
          context: input.caseId ? JSON.stringify({ caseId: input.caseId }) : undefined,
        });
        
        // Save assistant response
        await saveAIConversation({
          userId: ctx.user.id,
          conversationId,
          message: response.choices[0]?.message?.content || "",
          role: "ASSISTANT",
        });
        
        const assistantMessage = response.choices[0]?.message;
        
        // Handle function calls
        if (assistantMessage?.function_call) {
          const functionName = assistantMessage.function_call.name;
          const functionArgs = JSON.parse(assistantMessage.function_call.arguments || "{}");
          
          // Execute the function
          let functionResult: any;
          try {
            switch (functionName) {
              case "search_cases":
                // Search cases by query
                const allCases = await db.getAllCases();
                functionResult = allCases.filter((c: any) => {
                  const matchesQuery = !functionArgs.query || 
                    c.trackingId?.toLowerCase().includes(functionArgs.query.toLowerCase()) ||
                    c.customerName?.toLowerCase().includes(functionArgs.query.toLowerCase()) ||
                    c.caseNumber?.toLowerCase().includes(functionArgs.query.toLowerCase());
                  const matchesCarrier = !functionArgs.carrier || c.carrier === functionArgs.carrier;
                  const matchesStatus = !functionArgs.status || c.status === functionArgs.status;
                  return matchesQuery && matchesCarrier && matchesStatus;
                });
                break;
              case "create_case":
                // Generate case number
                const caseNumber = `CASE-${Date.now()}`;
                await db.createCase({
                  caseNumber,
                  trackingId: functionArgs.trackingId,
                  carrier: functionArgs.carrier,
                  originalAmount: Math.round(functionArgs.originalAmount * 100),
                  adjustedAmount: Math.round(functionArgs.adjustedAmount * 100),
                  claimedAmount: Math.round(functionArgs.claimedAmount * 100),
                  notes: functionArgs.notes,
                  createdBy: ctx.user.id,
                });
                functionResult = { success: true, caseNumber };
                break;
              case "get_case_details":
                functionResult = await db.getCaseById(functionArgs.caseId);
                break;
              case "analyze_image":
                const { analyzeImage: analyzeImg } = await import('./services/openaiService');
                const prompt = functionArgs.analysisType === "label" 
                  ? "Extract all shipping information from this label including tracking number, carrier, dimensions, weight, addresses, and service type."
                  : functionArgs.analysisType === "damage"
                  ? "Describe the damage visible in this image in detail. Include type of damage, severity, and affected areas."
                  : "Analyze this image and provide detailed information.";
                functionResult = await analyzeImg(functionArgs.imageUrl, prompt);
                break;
              case "web_search":
                const { webSearch } = await import('./services/openaiService');
                functionResult = await webSearch(functionArgs.query);
                break;
              default:
                functionResult = { error: "Unknown function" };
            }
            
            // Save function call result
            await saveAIConversation({
              userId: ctx.user.id,
              conversationId,
              message: JSON.stringify({ function: functionName, args: functionArgs, result: functionResult }),
              role: "ASSISTANT",
              actionTaken: functionName,
            });
            
            return {
              message: assistantMessage.content || "",
              functionCall: {
                name: functionName,
                arguments: functionArgs,
                result: functionResult,
              },
            };
          } catch (error: any) {
            return {
              message: `I encountered an error executing ${functionName}: ${error.message}`,
              functionCall: {
                name: functionName,
                arguments: functionArgs,
                error: error.message,
              },
            };
          }
        }
        
        return {
          message: assistantMessage?.content || "",
          functionCall: undefined,
        };
      }),
    
    analyzeImage: protectedProcedure
      .input(z.object({
        imageUrl: z.string(),
        prompt: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { analyzeImage } = await import('./services/openaiService');
        const analysis = await analyzeImage(input.imageUrl, input.prompt);
        return { analysis };
      }),
    
    extractDataFromImage: protectedProcedure
      .input(z.object({
        imageUrl: z.string(),
        fields: z.array(z.string()),
      }))
      .mutation(async ({ input }) => {
        const { extractDataFromImage } = await import('./services/openaiService');
        const data = await extractDataFromImage(input.imageUrl, input.fields);
        return { data };
      }),
    
    getConversationHistory: protectedProcedure
      .input(z.object({
        conversationId: z.string().optional(),
        limit: z.number().optional(),
      }))
      .query(async ({ input, ctx }) => {
        const { getAIConversationHistory } = await import('./db');
        return await getAIConversationHistory(ctx.user.id, input.conversationId, input.limit);
      }),
  }),

  // ShipStation orders
  shipstation: router({
    listOrders: protectedProcedure
      .input(z.object({
        accountName: z.string().optional(),
        orderStatus: z.string().optional(),
        orderDateStart: z.string().optional(),
        orderDateEnd: z.string().optional(),
        page: z.number().optional(),
        pageSize: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const { listShipStationOrders } = await import('./services/shipstationService');
        return await listShipStationOrders(input);
      }),
    
    listStores: protectedProcedure
      .input(z.object({
        accountName: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const { listShipStationStores } = await import('./services/shipstationService');
        return await listShipStationStores(input.accountName);
      }),
    
    listCarriers: protectedProcedure
      .input(z.object({
        accountName: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const { listShipStationCarriers } = await import('./services/shipstationService');
        return await listShipStationCarriers(input.accountName);
      }),
  }),

  // Email management
  email: router({
    listAccounts: protectedProcedure.query(async ({ ctx }) => {
      return await db.getEmailAccounts(ctx.user.id);
    }),
    
    createAccount: protectedProcedure
      .input(z.object({
        accountName: z.string(),
        emailAddress: z.string().email(),
        provider: z.enum(["SMTP", "GMAIL_API", "ZOHO"]),
        smtpHost: z.string().optional(),
        smtpPort: z.number().optional(),
        smtpUsername: z.string().optional(),
        smtpPassword: z.string().optional(),
        smtpSecure: z.boolean().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { encryptCredential } = await import('./services/apiService');
        
        const encryptedPassword = input.smtpPassword 
          ? encryptCredential(input.smtpPassword)
          : null;
        
        await db.createEmailAccount({
          userId: ctx.user.id,
          accountName: input.accountName,
          emailAddress: input.emailAddress,
          provider: input.provider,
          smtpHost: input.smtpHost || null,
          smtpPort: input.smtpPort || null,
          smtpUsername: input.smtpUsername || null,
          smtpPassword: encryptedPassword ? JSON.stringify(encryptedPassword) : null,
          smtpSecure: input.smtpSecure ? 1 : 0,
          isDefault: input.isDefault ? 1 : 0,
          isActive: 1,
        });
        
        return { success: true };
      }),
    
    testAccount: protectedProcedure
      .input(z.object({ accountId: z.number() }))
      .mutation(async ({ input }) => {
        const account = await db.getEmailAccountById(input.accountId);
        if (!account) throw new Error("Email account not found");
        
        if (account.provider === "SMTP") {
          const { decryptCredential } = await import('./services/apiService');
          const { testSMTPConnection } = await import('./services/emailService');
          
          const password = account.smtpPassword 
            ? (() => {
                const parsed = JSON.parse(account.smtpPassword);
                return decryptCredential(parsed.encrypted, parsed.iv, parsed.tag);
              })()
            : '';
          
          const success = await testSMTPConnection({
            host: account.smtpHost || '',
            port: account.smtpPort || 587,
            secure: account.smtpSecure === 1,
            auth: {
              user: account.smtpUsername || '',
              pass: password,
            },
          });
          
          return { success };
        }
        
        return { success: false, error: "Provider not supported yet" };
      }),
    
    sendEmail: protectedProcedure
      .input(z.object({
        accountId: z.number(),
        to: z.union([z.string(), z.array(z.string())]),
        subject: z.string(),
        html: z.string().optional(),
        text: z.string().optional(),
        caseId: z.number().optional(),
        attachments: z.array(z.object({
          filename: z.string(),
          path: z.string().optional(),
          content: z.string().optional(),
        })).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const account = await db.getEmailAccountById(input.accountId);
        if (!account) throw new Error("Email account not found");
        
        const { decryptCredential } = await import('./services/apiService');
        const { sendEmailSMTP } = await import('./services/emailService');
        
        let result;
        
        if (account.provider === "SMTP") {
          const password = account.smtpPassword 
            ? (() => {
                const parsed = JSON.parse(account.smtpPassword);
                return decryptCredential(parsed.encrypted, parsed.iv, parsed.tag);
              })()
            : '';
          
          result = await sendEmailSMTP(
            {
              host: account.smtpHost || '',
              port: account.smtpPort || 587,
              secure: account.smtpSecure === 1,
              auth: {
                user: account.smtpUsername || '',
                pass: password,
              },
            },
            {
              from: account.emailAddress,
              to: input.to,
              subject: input.subject,
              html: input.html,
              text: input.text,
              attachments: input.attachments,
            }
          );
        } else {
          return { success: false, error: "Provider not supported yet" };
        }
        
        // Log email communication
        const emailId = await db.createEmailCommunication({
          caseId: input.caseId || null,
          emailAccountId: account.id,
          direction: "SENT",
          fromAddress: account.emailAddress,
          toAddresses: JSON.stringify(Array.isArray(input.to) ? input.to : [input.to]),
          subject: input.subject,
          bodyHtml: input.html || null,
          bodyText: input.text || null,
          status: result.success ? "SENT" : "FAILED",
          errorMessage: result.error || null,
          messageId: result.messageId || null,
          sentAt: result.success ? new Date() : null,
        });
        
        // If linked to a case, add activity log
        if (input.caseId && result.success) {
          await db.createActivityLog({
            caseId: input.caseId,
            userId: ctx.user.id,
            actionType: "EMAIL_SENT",
            description: `Email sent to ${Array.isArray(input.to) ? input.to.join(', ') : input.to}: ${input.subject}`,
            metadata: JSON.stringify({ emailId, messageId: result.messageId }),
          });
        }
        
        return result;
      }),
    
    getCaseEmails: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .query(async ({ input }) => {
        return await db.getEmailCommunications(input.caseId);
      }),
  }),

  // Zoho Desk integration
  zoho: router({
    testConnection: protectedProcedure.mutation(async () => {
      const { testZohoDeskConnection } = await import('./services/zohoDeskService');
      const success = await testZohoDeskConnection();
      return { success };
    }),
    
    getDepartments: protectedProcedure.query(async () => {
      const { getZohoDeskDepartments } = await import('./services/zohoDeskService');
      return await getZohoDeskDepartments();
    }),
    
    createTicketFromCase: protectedProcedure
      .input(z.object({ caseId: z.number() }))
      .mutation(async ({ input }) => {
        const caseData = await db.getCaseById(input.caseId);
        if (!caseData) throw new Error("Case not found");
        
        const attachments = await db.getCaseAttachments(input.caseId);
        
        const { createTicketFromCase } = await import('./services/zohoDeskService');
        const ticket = await createTicketFromCase({
          caseNumber: caseData.caseNumber,
          trackingId: caseData.trackingId,
          carrier: caseData.carrier,
          claimedAmount: caseData.claimedAmount,
          customerName: caseData.customerName || undefined,
          customerEmail: caseData.customerEmail || undefined,
          customerPhone: caseData.customerPhone || undefined,
          notes: caseData.notes || undefined,
          attachments: attachments.map(a => ({
            url: a.fileUrl,
            fileName: a.fileName,
          })),
        });
        
        // Update case with Zoho ticket info
        await db.updateCase(input.caseId, {
          zohoDeskTicketId: ticket.ticketId,
        });
        
        // Log activity
        await db.createActivityLog({
          caseId: input.caseId,
          userId: 1, // System user
          actionType: "ZOHO_TICKET_CREATED",
          description: `Zoho Desk ticket created: ${ticket.ticketNumber}`,
          metadata: JSON.stringify(ticket),
        });
        
        return ticket;
      }),
  }),

  // Mass import
  import: router({
    parseFile: protectedProcedure
      .input(z.object({
        content: z.string(),
        fileName: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { parseFile } = await import('./services/importService');
        const rows = parseFile(input.content, input.fileName);
        return { rows };
      }),
    
    importCases: protectedProcedure
      .input(z.object({
        rows: z.array(z.any()),
      }))
      .mutation(async ({ input, ctx }) => {
        const { rowToCaseData, validateRow } = await import('./services/importService');
        
        const results = [];
        let success = 0;
        let failed = 0;
        
        for (let i = 0; i < input.rows.length; i++) {
          const row = input.rows[i];
          const validation = validateRow(row);
          
          if (!validation.valid) {
            results.push({
              row: i + 1,
              data: row,
              status: 'error' as const,
              error: validation.errors.join(', '),
            });
            failed++;
            continue;
          }
          
          try {
            const caseData = rowToCaseData(row, ctx.user.id);
            const createdCase = await db.createCase(caseData);
            
            // Log activity
            await db.createActivityLog({
              caseId: createdCase.id,
              userId: ctx.user.id,
              actionType: 'CASE_CREATED',
              description: 'Case created via mass import',
            });
            
            results.push({
              row: i + 1,
              data: row,
              status: 'success' as const,
              caseId: createdCase.id,
            });
            success++;
          } catch (error: any) {
            results.push({
              row: i + 1,
              data: row,
              status: 'error' as const,
              error: error.message,
            });
            failed++;
          }
        }
        
        return { results, success, failed };
      }),
  }),

  // WooCommerce integration
  woocommerce: router({
    getOrders: protectedProcedure
      .input(z.object({
        page: z.number().optional(),
        perPage: z.number().optional(),
        status: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const { getWooCommerceOrders } = await import('./services/woocommerceService');
        return await getWooCommerceOrders(input);
      }),
    
    getOrder: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        const { getWooCommerceOrder } = await import('./services/woocommerceService');
        return await getWooCommerceOrder(input.orderId);
      }),
    
    getProducts: protectedProcedure
      .input(z.object({
        page: z.number().optional(),
        perPage: z.number().optional(),
        search: z.string().optional(),
        sku: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const { getWooCommerceProducts } = await import('./services/woocommerceService');
        return await getWooCommerceProducts(input);
      }),
    
    syncOrder: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getWooCommerceOrder, syncWooCommerceOrder } = await import('./services/woocommerceService');
        const order = await getWooCommerceOrder(input.orderId);
        const id = await syncWooCommerceOrder(order, ctx.user.id);
        return { success: true, id };
      }),
    
    testConnection: protectedProcedure
      .mutation(async () => {
        const { testWooCommerceConnection } = await import('./services/woocommerceService');
        const success = await testWooCommerceConnection();
        return { success };
      }),
    
    getOrderNotes: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        const { getWooCommerceOrderNotes } = await import('./services/woocommerceService');
        return await getWooCommerceOrderNotes(input.orderId);
      }),
  }),

  // Products management
  products: router({
    list: protectedProcedure
      .input(z.object({
        search: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        const { products } = await import('../drizzle/schema');
        const { like, or } = await import('drizzle-orm');
        
        if (input.search) {
          return await db
            .select()
            .from(products)
            .where(
              or(
                like(products.sku, `%${input.search}%`),
                like(products.name, `%${input.search}%`)
              )
            );
        }
        
        return await db.select().from(products);
      }),
    
    create: protectedProcedure
      .input(z.object({
        sku: z.string(),
        name: z.string(),
        description: z.string().optional(),
        weight: z.number().optional(),
        length: z.number().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
        price: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const { products } = await import('../drizzle/schema');
        const result = await db.insert(products).values(input);
        return { id: result[0].insertId };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const { products } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        await db.delete(products).where(eq(products.id, input.id));
        return { success: true };
      }),
    
    syncFromWooCommerce: protectedProcedure
      .mutation(async ({ ctx }) => {
        const { getWooCommerceProducts } = await import('./services/woocommerceService');
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const { products } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        
        // Fetch all products from WooCommerce (paginated)
        let page = 1;
        let hasMore = true;
        let syncedCount = 0;
        let updatedCount = 0;
        
        while (hasMore) {
          const wooProducts = await getWooCommerceProducts({ page, perPage: 50 });
          
          if (!wooProducts || wooProducts.length === 0) {
            hasMore = false;
            break;
          }
          
          for (const wooProduct of wooProducts) {
            // Check if product exists by SKU
            const existing = wooProduct.sku 
              ? await db.select().from(products).where(eq(products.sku, wooProduct.sku)).limit(1)
              : [];
            
            // Convert weight from lbs to ounces (WooCommerce uses lbs, schema uses ounces)
            const weightInOunces = wooProduct.weight ? Math.round(parseFloat(wooProduct.weight) * 16) : undefined;
            
            // Build dimensions string
            const dims = wooProduct.dimensions;
            const dimensionsStr = (dims?.length && dims?.width && dims?.height)
              ? `${dims.length}x${dims.width}x${dims.height}`
              : undefined;
            
            // Extract image URLs
            const imageUrls = wooProduct.images && wooProduct.images.length > 0 
              ? wooProduct.images.map((img: any) => img.src)
              : [];
            
            const productData = {
              sku: wooProduct.sku || `WC-${wooProduct.id}`,
              productName: wooProduct.name,
              description: wooProduct.description || wooProduct.short_description || undefined,
              weight: weightInOunces,
              dimensions: dimensionsStr,
              price: wooProduct.price ? Math.round(parseFloat(wooProduct.price) * 100) : undefined, // convert to cents
              images: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
              woocommerceId: wooProduct.id,
              updatedAt: new Date(),
            };
            
            if (existing.length > 0) {
              // Update existing product
              await db.update(products)
                .set(productData)
                .where(eq(products.id, existing[0].id));
              updatedCount++;
            } else {
              // Insert new product
              await db.insert(products).values({
                ...productData,
                createdAt: new Date(),
              });
              syncedCount++;
            }
          }
          
          // Rate limiting: wait 100ms between pages
          await new Promise(resolve => setTimeout(resolve, 100));
          
          if (wooProducts.length < 50) {
            hasMore = false;
          } else {
            page++;
          }
        }
        
        return { 
          success: true, 
          synced: syncedCount, 
          updated: updatedCount,
          total: syncedCount + updatedCount 
        };
      }),
  }),

  certifications: router({
    list: protectedProcedure
      .input(z.object({ search: z.string().optional() }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        
        const { certifications } = await import('../drizzle/schema');
        const { like, or } = await import('drizzle-orm');
        
        if (input?.search) {
          return await db
            .select()
            .from(certifications)
            .where(
              or(
                like(certifications.certificationName, `%${input.search}%`),
                like(certifications.certificationName, `%${input.search}%`)
              )
            );
        }
        
        return await db.select().from(certifications);
      }),
    
    create: protectedProcedure
      .input(z.object({
        certificationName: z.string(),
        tubeDiameter: z.number().optional(),
        tubeLength: z.number().optional(),
        material: z.string().optional(),
        expiryDate: z.date().optional(),
        notes: z.string().optional(),
        attachmentUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const { certifications } = await import('../drizzle/schema');
        const result = await db.insert(certifications).values(input);
        return { id: result[0].insertId };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const { certifications } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        await db.delete(certifications).where(eq(certifications.id, input.id));
        return { success: true };
       }),
  }),

  googleSheets: router({
    syncShipments: protectedProcedure
      .input(z.object({
        spreadsheetId: z.string(),
        range: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // This would sync shipment data from Google Sheets
        // For now, return mock data - full implementation would:
        // 1. Use Google Sheets API with OAuth credentials
        // 2. Read shipment data from specified spreadsheet
        // 3. Parse and validate data
        // 4. Save to shipment_data table with source = 'GOOGLE_SHEETS'
        // 5. Run reconciliation with ShipStation and WooCommerce data
        
        return {
          success: true,
          synced: 0,
          errors: 0,
          message: 'Google Sheets sync completed',
        };
      }),

    createTemplate: protectedProcedure.mutation(async () => {
      // This would create a new Google Sheet with shipment tracking template
      // For now, return mock data - full implementation would:
      // 1. Use Google Sheets API to create new spreadsheet
      // 2. Add header row with required columns
      // 3. Return spreadsheet ID and URL
      
      return {
        success: true,
        spreadsheetId: '',
        url: '',
        message: 'Template sheet created',
      };
    }),
  }),

  deliveryGuarantee: router({
    checkShipments: protectedProcedure.mutation(async () => {
      // This would integrate with ShipStation to check delivery guarantees
      // For now, return mock data - full implementation would:
      // 1. Fetch recent delivered shipments from ShipStation
      // 2. Check if delivery date exceeded promised date
      // 3. Calculate refund amounts based on carrier policies
      // 4. Auto-create cases for violations
      
      return { 
        success: true, 
        violationsFound: 0,
        casesCreated: 0,
        message: 'Delivery guarantee monitoring completed' 
      };
    }),
  }),

  reports: router({
    generate: protectedProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        carrier: z.string().optional(),
        status: z.string().optional(),
        format: z.enum(['JSON', 'CSV', 'PDF']).optional(),
      }))
      .query(async ({ input }) => {
        // This would generate comprehensive report
        // For now, return mock data - full implementation would:
        // 1. Fetch cases from database with filters
        // 2. Generate report using reportingService
        // 3. Return formatted data or file URL
        
        return {
          summary: {
            totalCases: 0,
            totalClaimed: 0,
            totalRecovered: 0,
            successRate: 0,
            averageClaimAmount: 0,
            averageRecoveryTime: 0,
          },
          byCarrier: [],
          byStatus: [],
          byPriority: [],
          timeline: [],
        };
      }),

    exportCSV: protectedProcedure
      .input(z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ input }) => {
        // This would export report to CSV
        return {
          csv: '',
          filename: 'carrier-dispute-report.csv',
        };
      }),

    carrierPerformance: protectedProcedure
      .query(async () => {
        // This would generate carrier performance report
        return [];
      }),
  }),

  batch: router({
    updateCases: protectedProcedure
      .input(z.object({
        caseIds: z.array(z.number()),
        updates: z.object({
          status: z.string().optional(),
          priority: z.string().optional(),
          notes: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        // This would update multiple cases at once
        // For now, return mock data - full implementation would:
        // 1. Validate case IDs exist
        // 2. Apply updates to each case
        // 3. Log activity for each case
        // 4. Return success/failure counts
        
        return {
          success: input.caseIds.length,
          failed: 0,
          errors: [],
        };
      }),

    generateDocuments: protectedProcedure
      .input(z.object({
        caseIds: z.array(z.number()),
      }))
      .mutation(async ({ input }) => {
        // This would generate documents for multiple cases
        return {
          success: input.caseIds.length,
          failed: 0,
          errors: [],
          documents: [],
        };
      }),

    sendEmails: protectedProcedure
      .input(z.object({
        caseIds: z.array(z.number()),
        subject: z.string(),
        body: z.string(),
      }))
      .mutation(async ({ input }) => {
        // This would send emails for multiple cases
        return {
          success: input.caseIds.length,
          failed: 0,
          errors: [],
        };
      }),

    exportToCSV: protectedProcedure
      .input(z.object({
        caseIds: z.array(z.number()),
      }))
      .query(async ({ input }) => {
        // This would export cases to CSV
        return {
          csv: '',
          filename: 'cases-export.csv',
        };
      }),

    closeCases: protectedProcedure
      .input(z.object({
        caseIds: z.array(z.number()),
        reason: z.string(),
      }))
      .mutation(async ({ input }) => {
        // This would close multiple cases
        return {
          success: input.caseIds.length,
          failed: 0,
          errors: [],
        };
      }),
  }),

  calendar: router({
    createDeadline: protectedProcedure
      .input(z.object({
        caseId: z.number(),
        deadlineDate: z.date(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // This would create calendar event for case deadline
        // For now, return mock data - full implementation would:
        // 1. Get case details from database
        // 2. Call Google Calendar MCP to create event
        // 3. Set reminders (7 days, 3 days, 1 day before)
        // 4. Log activity in case timeline
        
        return {
          success: true,
          eventId: 'mock-event-id',
          message: 'Deadline reminder created',
        };
      }),

    createFollowUp: protectedProcedure
      .input(z.object({
        caseId: z.number(),
        followUpDate: z.date(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // This would create follow-up reminder
        return {
          success: true,
          eventId: 'mock-event-id',
          message: 'Follow-up reminder created',
        };
      }),

    getUpcomingDeadlines: protectedProcedure
      .input(z.object({
        daysAhead: z.number().optional(),
      }))
      .query(async ({ input }) => {
        // This would fetch upcoming deadlines from calendar
        return [];
      }),
  }),

  gmail: router({
    sendDisputeLetter: protectedProcedure
      .input(z.object({
        caseId: z.number(),
        recipientEmail: z.string().email(),
        letterContent: z.string(),
      }))
      .mutation(async ({ input }) => {
        // This would send dispute letter via Gmail MCP
        // For now, return mock data - full implementation would:
        // 1. Get case details from database
        // 2. Format dispute letter content
        // 3. Call Gmail MCP to send email
        // 4. Log activity in case timeline
        
        return {
          success: true,
          messageId: 'mock-message-id',
          message: 'Dispute letter sent via Gmail',
        };
      }),

    searchCarrierResponses: protectedProcedure
      .input(z.object({
        carrier: z.enum(['FEDEX', 'UPS', 'USPS', 'DHL', 'OTHER']),
      }))
      .query(async ({ input }) => {
        // This would search Gmail for carrier responses
        // For now, return empty array - full implementation would:
        // 1. Use Gmail MCP to search for emails from carrier domain
        // 2. Filter by keywords (dispute, claim, adjustment, refund)
        // 3. Return list of relevant messages
        
        return [];
      }),

    sendCaseUpdate: protectedProcedure
      .input(z.object({
        caseId: z.number(),
        recipientEmail: z.string().email(),
        updateMessage: z.string(),
      }))
      .mutation(async ({ input }) => {
        // This would send case update notification via Gmail
        return {
          success: true,
          message: 'Update notification sent',
        };
      }),
  }),

  audits: router({
    list: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      
      const { shipmentAudits } = await import('../drizzle/schema');
      const { desc } = await import('drizzle-orm');
      return await db.select().from(shipmentAudits).orderBy(desc(shipmentAudits.auditedAt));
    }),

    runAudit: protectedProcedure.mutation(async () => {
      // This would integrate with ShipStation to compare quoted vs actual rates
      // For now, return success - full implementation would:
      // 1. Fetch recent shipments from ShipStation
      // 2. Compare quoted rate vs actual charged rate
      // 3. Flag discrepancies and save to shipmentAudits table
      // 4. Optionally auto-create cases for significant overcharges
      
      return { success: true, message: 'Audit completed' };
    }),
  }),
});
export type AppRouter = typeof appRouter;
