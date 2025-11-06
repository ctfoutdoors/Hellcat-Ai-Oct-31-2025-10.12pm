import { invokeLLM } from "../_core/llm";
import { actionLibrary } from "./radialMenuService";

export interface RecommendationContext {
  page: string;
  userId: number;
  entityType?: string;
  entityId?: number;
  entityData?: any;
  userRole?: string;
  recentActions?: string[];
}

export interface ActionRecommendation {
  actionId: string;
  label: string;
  icon: string;
  actionType: string;
  category: string;
  confidence: number;
  reason: string;
  priority: number;
}

export class RecommendationService {
  /**
   * Get action recommendations based on context
   */
  static async getRecommendations(
    context: RecommendationContext
  ): Promise<ActionRecommendation[]> {
    const { page, entityType, entityData, userRole, recentActions } = context;

    // Get all available actions
    const allActions = this.getAllActions();

    // Build context for LLM
    const contextPrompt = this.buildContextPrompt(context);

    // Get AI recommendations
    const aiRecommendations = await this.getAIRecommendations(
      contextPrompt,
      allActions
    );

    // Combine with rule-based recommendations
    const ruleBasedRecommendations = this.getRuleBasedRecommendations(context);

    // Merge and rank recommendations
    const mergedRecommendations = this.mergeRecommendations(
      aiRecommendations,
      ruleBasedRecommendations
    );

    // Return top 8 recommendations
    return mergedRecommendations.slice(0, 8);
  }

  /**
   * Get all available actions from action library
   */
  private static getAllActions(): any[] {
    const actions: any[] = [];
    Object.entries(actionLibrary).forEach(([category, categoryActions]) => {
      categoryActions.forEach((action: any) => {
        actions.push({ ...action, category });
      });
    });
    return actions;
  }

  /**
   * Build context prompt for LLM
   */
  private static buildContextPrompt(context: RecommendationContext): string {
    let prompt = `You are an AI assistant helping users with a carrier dispute management system. 
    
Current context:
- Page: ${context.page}
- User role: ${context.userRole || "user"}`;

    if (context.entityType && context.entityData) {
      prompt += `\n- Viewing: ${context.entityType}`;
      if (context.entityData.status) {
        prompt += `\n- Status: ${context.entityData.status}`;
      }
      if (context.entityData.carrier) {
        prompt += `\n- Carrier: ${context.entityData.carrier}`;
      }
      if (context.entityData.claimedAmount) {
        prompt += `\n- Claimed amount: $${context.entityData.claimedAmount}`;
      }
    }

    if (context.recentActions && context.recentActions.length > 0) {
      prompt += `\n- Recent actions: ${context.recentActions.join(", ")}`;
    }

    prompt += `\n\nBased on this context, suggest the most relevant actions the user might want to take next. Consider:
1. What actions make sense for the current page
2. What the user has been doing recently
3. What typical workflows involve
4. What would help the user be more productive

Provide recommendations with confidence scores (0-100) and brief reasons.`;

    return prompt;
  }

  /**
   * Get AI-powered recommendations using LLM
   */
  private static async getAIRecommendations(
    contextPrompt: string,
    allActions: any[]
  ): Promise<ActionRecommendation[]> {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are an AI assistant that recommends actions based on context. Return recommendations as JSON.",
          },
          {
            role: "user",
            content: `${contextPrompt}\n\nAvailable actions:\n${JSON.stringify(
              allActions.map((a) => ({
                id: a.id,
                label: a.label,
                category: a.category,
                description: a.description,
              })),
              null,
              2
            )}\n\nReturn top 8 recommendations as JSON array with fields: actionId, confidence (0-100), reason, priority (1-10).`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "action_recommendations",
            strict: true,
            schema: {
              type: "object",
              properties: {
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      actionId: { type: "string" },
                      confidence: { type: "number" },
                      reason: { type: "string" },
                      priority: { type: "number" },
                    },
                    required: ["actionId", "confidence", "reason", "priority"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["recommendations"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0].message.content;
      if (!content) return [];

      const parsed = JSON.parse(content);
      const recommendations: ActionRecommendation[] = [];

      for (const rec of parsed.recommendations) {
        const action = allActions.find((a) => a.id === rec.actionId);
        if (action) {
          recommendations.push({
            actionId: action.id,
            label: action.label,
            icon: action.icon,
            actionType: action.actionType,
            category: action.category,
            confidence: rec.confidence,
            reason: rec.reason,
            priority: rec.priority,
          });
        }
      }

      return recommendations;
    } catch (error) {
      console.error("Error getting AI recommendations:", error);
      return [];
    }
  }

  /**
   * Get rule-based recommendations
   */
  private static getRuleBasedRecommendations(
    context: RecommendationContext
  ): ActionRecommendation[] {
    const recommendations: ActionRecommendation[] = [];

    // Page-specific recommendations
    if (context.page === "dashboard") {
      recommendations.push({
        actionId: "createCase",
        label: "Create Case",
        icon: "Plus",
        actionType: "navigate",
        category: "navigation",
        confidence: 90,
        reason: "Quick access to create new case",
        priority: 10,
      });
      recommendations.push({
        actionId: "reports",
        label: "Reports",
        icon: "BarChart3",
        actionType: "navigate",
        category: "navigation",
        confidence: 80,
        reason: "View detailed analytics",
        priority: 8,
      });
    }

    if (context.page === "cases") {
      recommendations.push({
        actionId: "createCase",
        label: "Create Case",
        icon: "Plus",
        actionType: "navigate",
        category: "navigation",
        confidence: 95,
        reason: "Create a new dispute case",
        priority: 10,
      });
      recommendations.push({
        actionId: "exportCSV",
        label: "Export CSV",
        icon: "FileSpreadsheet",
        actionType: "export",
        category: "export",
        confidence: 70,
        reason: "Export cases for analysis",
        priority: 7,
      });
    }

    if (context.page === "case-detail" && context.entityData) {
      const status = context.entityData.status;

      if (status === "draft" || status === "pending") {
        recommendations.push({
          actionId: "generateLetter",
          label: "Generate Letter",
          icon: "FileText",
          actionType: "api",
          category: "documents",
          confidence: 95,
          reason: "Generate dispute letter to file claim",
          priority: 10,
        });
        recommendations.push({
          actionId: "fileClaim",
          label: "File Claim",
          icon: "Send",
          actionType: "navigate",
          category: "carrier",
          confidence: 90,
          reason: "Submit claim to carrier",
          priority: 9,
        });
      }

      if (status === "filed" || status === "in_progress") {
        recommendations.push({
          actionId: "trackShipment",
          label: "Track Shipment",
          icon: "MapPin",
          actionType: "api",
          category: "carrier",
          confidence: 85,
          reason: "Check shipment tracking status",
          priority: 9,
        });
        recommendations.push({
          actionId: "setReminder",
          label: "Set Reminder",
          icon: "Bell",
          actionType: "api",
          category: "taskManagement",
          confidence: 80,
          reason: "Set follow-up reminder",
          priority: 8,
        });
      }

      // Always suggest export for case detail
      recommendations.push({
        actionId: "exportPDF",
        label: "Export PDF",
        icon: "FileDown",
        actionType: "export",
        category: "export",
        confidence: 75,
        reason: "Download case details as PDF",
        priority: 7,
      });
    }

    return recommendations;
  }

  /**
   * Merge AI and rule-based recommendations
   */
  private static mergeRecommendations(
    aiRecs: ActionRecommendation[],
    ruleRecs: ActionRecommendation[]
  ): ActionRecommendation[] {
    const merged = new Map<string, ActionRecommendation>();

    // Add rule-based recommendations
    for (const rec of ruleRecs) {
      merged.set(rec.actionId, rec);
    }

    // Add or boost AI recommendations
    for (const rec of aiRecs) {
      const existing = merged.get(rec.actionId);
      if (existing) {
        // Boost confidence if both systems recommend it
        existing.confidence = Math.min(
          100,
          (existing.confidence + rec.confidence) / 2 + 10
        );
        existing.priority = Math.max(existing.priority, rec.priority);
      } else {
        merged.set(rec.actionId, rec);
      }
    }

    // Sort by confidence and priority
    return Array.from(merged.values()).sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return b.confidence - a.confidence;
    });
  }

  /**
   * Execute voice command using natural language
   */
  static async executeVoiceCommand(
    command: string,
    context: RecommendationContext
  ): Promise<{
    success: boolean;
    action?: string;
    message: string;
    actionData?: any;
  }> {
    try {
      const allActions = this.getAllActions();

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are an AI assistant that interprets voice commands and maps them to actions. Return the matched action and parameters as JSON.",
          },
          {
            role: "user",
            content: `Voice command: "${command}"\n\nContext: ${JSON.stringify(
              context
            )}\n\nAvailable actions:\n${JSON.stringify(
              allActions.map((a) => ({
                id: a.id,
                label: a.label,
                category: a.category,
                description: a.description,
              })),
              null,
              2
            )}\n\nMatch the voice command to the most appropriate action. Return JSON with: actionId, confidence (0-100), parameters (object), message (user-friendly response).`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "voice_command_result",
            strict: true,
            schema: {
              type: "object",
              properties: {
                actionId: { type: "string" },
                confidence: { type: "number" },
                parameters: { type: "object" },
                message: { type: "string" },
              },
              required: ["actionId", "confidence", "parameters", "message"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        return {
          success: false,
          message: "Could not understand the command",
        };
      }

      const parsed = JSON.parse(content);

      if (parsed.confidence < 60) {
        return {
          success: false,
          message: `I'm not sure what you meant. Did you mean to ${parsed.message}?`,
        };
      }

      return {
        success: true,
        action: parsed.actionId,
        message: parsed.message,
        actionData: parsed.parameters,
      };
    } catch (error) {
      console.error("Error executing voice command:", error);
      return {
        success: false,
        message: "Sorry, I encountered an error processing your command",
      };
    }
  }
}
