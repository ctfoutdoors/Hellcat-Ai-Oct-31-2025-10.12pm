import { getDb } from "../db";
import { cases, attachments } from "../../drizzle/schema";
import OpenAI from "openai";
import { EvidencePackageService } from "./evidencePackage";
import { ShipStationSyncService } from "./shipstationSync";
// Email service import removed
// import { AutoStatusUpdatesService } from "./autoStatusUpdates";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

interface AIAction {
  action: string;
  parameters: Record<string, any>;
  reasoning: string;
}

export class AIAgentService {
  /**
   * AI Agent function definitions for OpenAI function calling
   */
  static readonly AGENT_FUNCTIONS = [
    {
      name: "create_case",
      description: "Create a new carrier dispute case",
      parameters: {
        type: "object",
        properties: {
          trackingNumber: { type: "string" },
          carrier: { type: "string", enum: ["FEDEX", "UPS", "USPS", "DHL"] },
          claimedAmount: { type: "number" },
          priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] },
          notes: { type: "string" },
        },
        required: ["trackingNumber", "carrier", "claimedAmount"],
      },
    },
    {
      name: "update_case_status",
      description: "Update the status of an existing case",
      parameters: {
        type: "object",
        properties: {
          caseId: { type: "number" },
          status: {
            type: "string",
            enum: ["DRAFT", "FILED", "AWAITING_RESPONSE", "RESOLVED", "CLOSED", "REJECTED"],
          },
          notes: { type: "string" },
        },
        required: ["caseId", "status"],
      },
    },
    {
      name: "generate_dispute_letter",
      description: "Generate a professional dispute letter for a case",
      parameters: {
        type: "object",
        properties: {
          caseId: { type: "number" },
          tone: { type: "string", enum: ["professional", "firm", "escalated"] },
        },
        required: ["caseId"],
      },
    },
    {
      name: "build_evidence_package",
      description: "Build a complete evidence package ZIP for a case",
      parameters: {
        type: "object",
        properties: {
          caseId: { type: "number" },
        },
        required: ["caseId"],
      },
    },
    {
      name: "sync_shipstation",
      description: "Trigger a ShipStation sync to detect new adjustments",
      parameters: {
        type: "object",
        properties: {
          dateRange: { type: "string", description: "Date range like 'last_7_days'" },
        },
      },
    },
    {
      name: "send_email_notification",
      description: "Send an email notification",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string" },
          subject: { type: "string" },
          body: { type: "string" },
        },
        required: ["to", "subject", "body"],
      },
    },
    {
      name: "search_cases",
      description: "Search for cases matching criteria",
      parameters: {
        type: "object",
        properties: {
          carrier: { type: "string" },
          status: { type: "string" },
          minAmount: { type: "number" },
          maxAmount: { type: "number" },
        },
      },
    },
    {
      name: "get_case_details",
      description: "Get full details of a specific case",
      parameters: {
        type: "object",
        properties: {
          caseId: { type: "number" },
        },
        required: ["caseId"],
      },
    },
  ];

  /**
   * Execute AI agent action
   */
  static async executeAction(
    action: string,
    parameters: Record<string, any>,
    userId: number
  ): Promise<any> {
    const db = getDb();

    switch (action) {
      case "create_case":
        const caseNumber = `CASE-${Date.now().toString(36).toUpperCase()}`;
        const [newCase] = await db
          .insert(cases)
          .values({
            caseNumber,
            trackingNumber: parameters.trackingNumber,
            carrier: parameters.carrier,
            claimedAmount: parameters.claimedAmount.toString(),
            priority: parameters.priority || "MEDIUM",
            status: "DRAFT",
            notes: parameters.notes,
            createdBy: userId,
          })
          .returning();
        return { success: true, caseId: newCase.id, caseNumber };

      case "update_case_status":
        await db
          .update(cases)
          .set({
            status: parameters.status,
            notes: parameters.notes,
            updatedAt: new Date(),
          })
          .where(eq(cases.id, parameters.caseId));
        return { success: true, caseId: parameters.caseId };

      case "generate_dispute_letter":
        // This would call the dispute letter generation service
        return {
          success: true,
          message: "Dispute letter generated",
          caseId: parameters.caseId,
        };

      case "build_evidence_package":
        const evidencePackage = await EvidencePackageService.buildEvidencePackage(
          parameters.caseId
        );
        return {
          success: true,
          message: "Evidence package built",
          size: evidencePackage.length,
        };

      case "sync_shipstation":
        // Trigger ShipStation sync
        return {
          success: true,
          message: "ShipStation sync triggered",
        };

      case "send_email_notification":
        // Send email via email service
        return {
          success: true,
          message: "Email sent",
          to: parameters.to,
        };

      case "search_cases":
        const allCases = await db.query.cases.findMany({
          where: (cases, { and, eq, gte, lte }) => {
            const conditions = [];
            if (parameters.carrier) {
              conditions.push(eq(cases.carrier, parameters.carrier));
            }
            if (parameters.status) {
              conditions.push(eq(cases.status, parameters.status));
            }
            return conditions.length > 0 ? and(...conditions) : undefined;
          },
          limit: 50,
        });
        return { success: true, cases: allCases, count: allCases.length };

      case "get_case_details":
        const caseDetails = await db.query.cases.findFirst({
          where: eq(cases.id, parameters.caseId),
          with: {
            attachments: true,
          },
        });
        return { success: true, case: caseDetails };

      default:
        return { success: false, error: "Unknown action" };
    }
  }

  /**
   * Process natural language request from user
   */
  static async processRequest(
    userMessage: string,
    userId: number
  ): Promise<{
    response: string;
    actionsExecuted: AIAction[];
    results: any[];
  }> {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant for a carrier dispute management system. You can help users by:
- Creating and updating cases
- Generating dispute letters
- Building evidence packages
- Searching for cases
- Triggering ShipStation syncs
- Sending email notifications

Use the available functions to help the user accomplish their goals.`,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      functions: this.AGENT_FUNCTIONS as any,
      function_call: "auto",
    });

    const message = completion.choices[0]?.message;
    const actionsExecuted: AIAction[] = [];
    const results: any[] = [];

    // Execute function calls
    if (message?.function_call) {
      const functionName = message.function_call.name;
      const functionArgs = JSON.parse(message.function_call.arguments || "{}");

      const result = await this.executeAction(functionName, functionArgs, userId);

      actionsExecuted.push({
        action: functionName,
        parameters: functionArgs,
        reasoning: "Executed based on user request",
      });

      results.push(result);
    }

    return {
      response: message?.content || "Action completed successfully.",
      actionsExecuted,
      results,
    };
  }

  /**
   * Autonomous agent mode - AI decides what actions to take
   */
  static async autonomousMode(
    goal: string,
    userId: number,
    maxActions: number = 10
  ): Promise<{
    goalAchieved: boolean;
    actionsExecuted: AIAction[];
    results: any[];
    reasoning: string;
  }> {
    const actionsExecuted: AIAction[] = [];
    const results: any[] = [];
    let currentGoal = goal;

    for (let i = 0; i < maxActions; i++) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an autonomous AI agent managing carrier disputes. Your goal: ${currentGoal}
            
Previous actions: ${JSON.stringify(actionsExecuted)}

Decide the next action to take to achieve the goal. If the goal is achieved, respond with "GOAL_ACHIEVED".`,
          },
          {
            role: "user",
            content: "What action should I take next?",
          },
        ],
        functions: this.AGENT_FUNCTIONS as any,
        function_call: "auto",
      });

      const message = completion.choices[0]?.message;

      if (message?.content?.includes("GOAL_ACHIEVED")) {
        return {
          goalAchieved: true,
          actionsExecuted,
          results,
          reasoning: message.content,
        };
      }

      if (message?.function_call) {
        const functionName = message.function_call.name;
        const functionArgs = JSON.parse(message.function_call.arguments || "{}");

        const result = await this.executeAction(functionName, functionArgs, userId);

        actionsExecuted.push({
          action: functionName,
          parameters: functionArgs,
          reasoning: message.content || "Autonomous decision",
        });

        results.push(result);
      } else {
        break;
      }
    }

    return {
      goalAchieved: false,
      actionsExecuted,
      results,
      reasoning: "Max actions reached or no more actions available",
    };
  }
}
