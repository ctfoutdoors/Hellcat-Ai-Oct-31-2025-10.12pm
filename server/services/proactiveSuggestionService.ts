import { ConversationService } from "./conversationService";

interface WorkflowPattern {
  sequence: string[]; // e.g., ["view_orders", "create_case"]
  frequency: number;
  lastOccurrence: Date;
  avgTimeBetweenSteps: number; // milliseconds
}

interface ProactiveSuggestion {
  id: string;
  message: string;
  action: string;
  actionData?: any;
  confidence: number;
  reason: string;
  category: "workflow" | "frequency" | "time_based" | "context";
}

export class ProactiveSuggestionService {
  /**
   * Analyze user's command patterns and generate proactive suggestions
   */
  static async generateProactiveSuggestions(
    userId: number,
    currentPage: string,
    currentContext?: {
      entityType?: string;
      entityId?: number;
      recentActions?: string[];
    }
  ): Promise<ProactiveSuggestion[]> {
    const suggestions: ProactiveSuggestion[] = [];

    // Get user preferences with command history
    const prefs = await ConversationService.getUserPreferences(userId);
    const frequentCommands = prefs.frequentCommands || {};
    const workflowPatterns = prefs.workflowPatterns || {};

    // 1. Frequency-based suggestions
    const frequencySuggestions = this.generateFrequencySuggestions(
      frequentCommands,
      currentPage
    );
    suggestions.push(...frequencySuggestions);

    // 2. Workflow pattern suggestions
    const workflowSuggestions = this.generateWorkflowSuggestions(
      workflowPatterns,
      currentPage,
      currentContext?.recentActions || []
    );
    suggestions.push(...workflowSuggestions);

    // 3. Time-based suggestions
    const timeSuggestions = this.generateTimeBasedSuggestions(
      prefs.lastPage,
      currentPage
    );
    suggestions.push(...timeSuggestions);

    // 4. Context-aware suggestions
    const contextSuggestions = this.generateContextSuggestions(
      currentPage,
      currentContext
    );
    suggestions.push(...contextSuggestions);

    // Sort by confidence and return top 3
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  }

  /**
   * Generate suggestions based on frequently used commands
   */
  private static generateFrequencySuggestions(
    frequentCommands: Record<string, number>,
    currentPage: string
  ): ProactiveSuggestion[] {
    const suggestions: ProactiveSuggestion[] = [];

    // Sort commands by frequency
    const sortedCommands = Object.entries(frequentCommands)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    for (const [command, count] of sortedCommands) {
      if (count >= 3) {
        // Only suggest if used 3+ times
        const suggestion = this.mapCommandToSuggestion(command, count);
        if (suggestion) {
          suggestions.push({
            ...suggestion,
            category: "frequency",
            confidence: Math.min(0.9, 0.5 + count * 0.05),
            reason: `You've used this command ${count} times`,
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * Generate suggestions based on workflow patterns
   */
  private static generateWorkflowSuggestions(
    workflowPatterns: Record<string, any>,
    currentPage: string,
    recentActions: string[]
  ): ProactiveSuggestion[] {
    const suggestions: ProactiveSuggestion[] = [];

    // Check if current context matches a known workflow pattern
    for (const [patternKey, pattern] of Object.entries(workflowPatterns)) {
      const sequence = pattern.sequence || [];
      const frequency = pattern.frequency || 0;

      // Check if recent actions match the beginning of a pattern
      if (frequency >= 2 && this.matchesPatternStart(recentActions, sequence)) {
        const nextAction = sequence[recentActions.length];
        if (nextAction) {
          const suggestion = this.mapCommandToSuggestion(nextAction, frequency);
          if (suggestion) {
            suggestions.push({
              ...suggestion,
              category: "workflow",
              confidence: Math.min(0.95, 0.6 + frequency * 0.1),
              reason: `You usually do this next (${frequency} times)`,
            });
          }
        }
      }
    }

    return suggestions;
  }

  /**
   * Generate time-based suggestions
   */
  private static generateTimeBasedSuggestions(
    lastPage: string | null,
    currentPage: string
  ): ProactiveSuggestion[] {
    const suggestions: ProactiveSuggestion[] = [];
    const hour = new Date().getHours();

    // Morning routine (8-10 AM)
    if (hour >= 8 && hour < 10 && currentPage === "dashboard") {
      suggestions.push({
        id: "morning_check",
        message: "Good morning! Would you like to check new cases?",
        action: "navigate_cases",
        confidence: 0.7,
        reason: "Morning routine",
        category: "time_based",
      });
    }

    // End of day (4-6 PM)
    if (hour >= 16 && hour < 18 && currentPage === "dashboard") {
      suggestions.push({
        id: "eod_report",
        message: "Generate today's summary report?",
        action: "generate_report",
        confidence: 0.65,
        reason: "End of day routine",
        category: "time_based",
      });
    }

    return suggestions;
  }

  /**
   * Generate context-aware suggestions
   */
  private static generateContextSuggestions(
    currentPage: string,
    context?: {
      entityType?: string;
      entityId?: number;
      recentActions?: string[];
    }
  ): ProactiveSuggestion[] {
    const suggestions: ProactiveSuggestion[] = [];

    // Case detail page suggestions
    if (currentPage === "case_detail" && context?.entityId) {
      suggestions.push({
        id: "generate_letter",
        message: "Ready to generate the dispute letter?",
        action: "generate_letter",
        actionData: { caseId: context.entityId },
        confidence: 0.75,
        reason: "Common action on case detail page",
        category: "context",
      });
    }

    // Orders page suggestions
    if (currentPage === "orders") {
      suggestions.push({
        id: "create_case_from_order",
        message: "Create a case from an order?",
        action: "create_case",
        confidence: 0.7,
        reason: "Common action on orders page",
        category: "context",
      });
    }

    // Cases page with no filters
    if (currentPage === "cases" && !context?.recentActions?.includes("filter")) {
      suggestions.push({
        id: "filter_cases",
        message: "Filter cases by carrier or status?",
        action: "open_filters",
        confidence: 0.65,
        reason: "Filtering helps find cases faster",
        category: "context",
      });
    }

    return suggestions;
  }

  /**
   * Map command string to actionable suggestion
   */
  private static mapCommandToSuggestion(
    command: string,
    frequency: number
  ): Partial<ProactiveSuggestion> | null {
    const commandLower = command.toLowerCase();

    if (commandLower.includes("create case")) {
      return {
        id: "create_case",
        message: "Create a new case?",
        action: "create_case",
      };
    }

    if (commandLower.includes("export") || commandLower.includes("pdf")) {
      return {
        id: "export_pdf",
        message: "Export to PDF?",
        action: "export_pdf",
      };
    }

    if (commandLower.includes("generate letter")) {
      return {
        id: "generate_letter",
        message: "Generate dispute letter?",
        action: "generate_letter",
      };
    }

    if (commandLower.includes("filter") || commandLower.includes("search")) {
      return {
        id: "filter_cases",
        message: "Filter or search cases?",
        action: "open_filters",
      };
    }

    if (commandLower.includes("report")) {
      return {
        id: "generate_report",
        message: "Generate a report?",
        action: "generate_report",
      };
    }

    return null;
  }

  /**
   * Check if recent actions match the start of a pattern
   */
  private static matchesPatternStart(
    recentActions: string[],
    pattern: string[]
  ): boolean {
    if (recentActions.length === 0 || recentActions.length >= pattern.length) {
      return false;
    }

    for (let i = 0; i < recentActions.length; i++) {
      if (recentActions[i] !== pattern[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Track user action to build workflow patterns
   */
  static async trackUserAction(
    userId: number,
    action: string,
    page: string
  ): Promise<void> {
    const prefs = await ConversationService.getUserPreferences(userId);
    const workflowPatterns = prefs.workflowPatterns || {};

    // Get recent actions from last session
    const lastSession = await ConversationService.getLastSession(userId);
    if (!lastSession) return;

    const recentMessages = await ConversationService.getConversationContext(
      lastSession.sessionId,
      10
    );

    // Extract actions from recent messages
    const recentActions = recentMessages
      .filter((msg) => msg.role === "user")
      .map((msg) => this.extractActionFromMessage(msg.content))
      .filter((a) => a !== null) as string[];

    recentActions.push(action);

    // Look for patterns (sequences of 2-4 actions)
    for (let len = 2; len <= Math.min(4, recentActions.length); len++) {
      const sequence = recentActions.slice(-len);
      const patternKey = sequence.join("_");

      if (!workflowPatterns[patternKey]) {
        workflowPatterns[patternKey] = {
          sequence,
          frequency: 1,
          lastOccurrence: new Date(),
        };
      } else {
        workflowPatterns[patternKey].frequency++;
        workflowPatterns[patternKey].lastOccurrence = new Date();
      }
    }

    // Update preferences
    await ConversationService.updatePreferences(userId, { workflowPatterns });
  }

  /**
   * Extract action from user message
   */
  private static extractActionFromMessage(message: string): string | null {
    const msgLower = message.toLowerCase();

    if (msgLower.includes("create case")) return "create_case";
    if (msgLower.includes("export") || msgLower.includes("pdf"))
      return "export_pdf";
    if (msgLower.includes("generate letter")) return "generate_letter";
    if (msgLower.includes("filter") || msgLower.includes("search"))
      return "filter";
    if (msgLower.includes("view") && msgLower.includes("case"))
      return "view_case";
    if (msgLower.includes("report")) return "generate_report";

    return null;
  }

  /**
   * Dismiss a suggestion (track that user didn't want it)
   */
  static async dismissSuggestion(
    userId: number,
    suggestionId: string
  ): Promise<void> {
    // Track dismissed suggestions to avoid showing them again
    const prefs = await ConversationService.getUserPreferences(userId);
    const dismissedRecs = prefs.dismissedRecommendations || [];

    if (!dismissedRecs.includes(suggestionId)) {
      dismissedRecs.push(suggestionId);
      await ConversationService.updatePreferences(userId, {
        dismissedRecommendations: dismissedRecs,
      });
    }
  }

  /**
   * Accept a suggestion (track that user found it helpful)
   */
  static async acceptSuggestion(
    userId: number,
    suggestionId: string
  ): Promise<void> {
    const prefs = await ConversationService.getUserPreferences(userId);
    const acceptedRecs = prefs.acceptedRecommendations || [];

    if (!acceptedRecs.includes(suggestionId)) {
      acceptedRecs.push(suggestionId);
      await ConversationService.updatePreferences(userId, {
        acceptedRecommendations: acceptedRecs,
      });
    }
  }
}
