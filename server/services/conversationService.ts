import { eq, and, desc } from "drizzle-orm";
import { getDb } from "../db";
import {
  conversationHistory,
  conversationSessions,
  aiChatbotPreferences,
  InsertConversationHistory,
  InsertConversationSession,
  InsertAIChatbotPreference,
} from "../../drizzle/schema";

export class ConversationService {
  /**
   * Create a new conversation session
   */
  static async createSession(
    userId: number,
    page?: string,
    entityType?: string,
    entityId?: number
  ): Promise<string> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db.insert(conversationSessions).values({
      sessionId,
      userId,
      page,
      entityType,
      entityId,
      startedAt: new Date(),
      messageCount: 0,
    });

    return sessionId;
  }

  /**
   * Add a message to conversation history
   */
  static async addMessage(
    userId: number,
    sessionId: string,
    role: "user" | "assistant",
    content: string,
    page?: string,
    entityType?: string,
    entityId?: number,
    metadata?: any
  ): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Insert message
    await db.insert(conversationHistory).values({
      userId,
      sessionId,
      role,
      content,
      page,
      entityType,
      entityId,
      metadata: metadata ? JSON.stringify(metadata) : null,
      createdAt: new Date(),
    });

    // Update session message count
    const session = await db
      .select()
      .from(conversationSessions)
      .where(eq(conversationSessions.sessionId, sessionId))
      .limit(1);

    if (session.length > 0) {
      await db
        .update(conversationSessions)
        .set({ messageCount: (session[0].messageCount || 0) + 1 })
        .where(eq(conversationSessions.sessionId, sessionId));
    }
  }

  /**
   * Get conversation history for a session
   */
  static async getSessionHistory(sessionId: string) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const messages = await db
      .select()
      .from(conversationHistory)
      .where(eq(conversationHistory.sessionId, sessionId))
      .orderBy(conversationHistory.createdAt);

    return messages.map((msg) => ({
      ...msg,
      metadata: msg.metadata ? JSON.parse(msg.metadata as string) : null,
    }));
  }

  /**
   * Get recent sessions for a user
   */
  static async getRecentSessions(userId: number, limit: number = 10) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return await db
      .select()
      .from(conversationSessions)
      .where(eq(conversationSessions.userId, userId))
      .orderBy(desc(conversationSessions.startedAt))
      .limit(limit);
  }

  /**
   * Get last active session for a user
   */
  static async getLastSession(userId: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const sessions = await db
      .select()
      .from(conversationSessions)
      .where(
        and(
          eq(conversationSessions.userId, userId),
          eq(conversationSessions.endedAt, null as any)
        )
      )
      .orderBy(desc(conversationSessions.startedAt))
      .limit(1);

    return sessions.length > 0 ? sessions[0] : null;
  }

  /**
   * End a conversation session
   */
  static async endSession(sessionId: string, summary?: string): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .update(conversationSessions)
      .set({
        endedAt: new Date(),
        summary: summary || null,
      })
      .where(eq(conversationSessions.sessionId, sessionId));
  }

  /**
   * Get or create user preferences
   */
  static async getUserPreferences(userId: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    let prefs = await db
      .select()
      .from(aiChatbotPreferences)
      .where(eq(aiChatbotPreferences.userId, userId))
      .limit(1);

    if (prefs.length === 0) {
      // Create default preferences
      await db.insert(aiChatbotPreferences).values({
        userId,
        preferredActions: JSON.stringify([]),
        frequentCommands: JSON.stringify({}),
        communicationStyle: "casual",
        recommendationFrequency: "medium",
        acceptedRecommendations: JSON.stringify([]),
        dismissedRecommendations: JSON.stringify([]),
        workflowPatterns: JSON.stringify({}),
      });

      prefs = await db
        .select()
        .from(aiChatbotPreferences)
        .where(eq(aiChatbotPreferences.userId, userId))
        .limit(1);
    }

    const pref = prefs[0];
    return {
      ...pref,
      preferredActions: pref.preferredActions
        ? JSON.parse(pref.preferredActions as string)
        : [],
      frequentCommands: pref.frequentCommands
        ? JSON.parse(pref.frequentCommands as string)
        : {},
      acceptedRecommendations: pref.acceptedRecommendations
        ? JSON.parse(pref.acceptedRecommendations as string)
        : [],
      dismissedRecommendations: pref.dismissedRecommendations
        ? JSON.parse(pref.dismissedRecommendations as string)
        : [],
      workflowPatterns: pref.workflowPatterns
        ? JSON.parse(pref.workflowPatterns as string)
        : {},
    };
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(
    userId: number,
    updates: Partial<{
      preferredActions: string[];
      frequentCommands: Record<string, number>;
      communicationStyle: "formal" | "casual" | "concise" | "detailed";
      recommendationFrequency: "high" | "medium" | "low";
      acceptedRecommendations: string[];
      dismissedRecommendations: string[];
      workflowPatterns: Record<string, any>;
      lastPage: string;
      lastEntityType: string;
      lastEntityId: number;
      lastSessionId: string;
    }>
  ): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const updateData: any = { updatedAt: new Date() };

    if (updates.preferredActions !== undefined) {
      updateData.preferredActions = JSON.stringify(updates.preferredActions);
    }
    if (updates.frequentCommands !== undefined) {
      updateData.frequentCommands = JSON.stringify(updates.frequentCommands);
    }
    if (updates.communicationStyle !== undefined) {
      updateData.communicationStyle = updates.communicationStyle;
    }
    if (updates.recommendationFrequency !== undefined) {
      updateData.recommendationFrequency = updates.recommendationFrequency;
    }
    if (updates.acceptedRecommendations !== undefined) {
      updateData.acceptedRecommendations = JSON.stringify(
        updates.acceptedRecommendations
      );
    }
    if (updates.dismissedRecommendations !== undefined) {
      updateData.dismissedRecommendations = JSON.stringify(
        updates.dismissedRecommendations
      );
    }
    if (updates.workflowPatterns !== undefined) {
      updateData.workflowPatterns = JSON.stringify(updates.workflowPatterns);
    }
    if (updates.lastPage !== undefined) {
      updateData.lastPage = updates.lastPage;
    }
    if (updates.lastEntityType !== undefined) {
      updateData.lastEntityType = updates.lastEntityType;
    }
    if (updates.lastEntityId !== undefined) {
      updateData.lastEntityId = updates.lastEntityId;
    }
    if (updates.lastSessionId !== undefined) {
      updateData.lastSessionId = updates.lastSessionId;
    }

    await db
      .update(aiChatbotPreferences)
      .set(updateData)
      .where(eq(aiChatbotPreferences.userId, userId));
  }

  /**
   * Track command usage (for learning)
   */
  static async trackCommandUsage(
    userId: number,
    command: string
  ): Promise<void> {
    const prefs = await this.getUserPreferences(userId);
    const frequentCommands = prefs.frequentCommands || {};
    frequentCommands[command] = (frequentCommands[command] || 0) + 1;

    await this.updatePreferences(userId, { frequentCommands });
  }

  /**
   * Track recommendation feedback (for learning)
   */
  static async trackRecommendationFeedback(
    userId: number,
    recommendationId: string,
    accepted: boolean
  ): Promise<void> {
    const prefs = await this.getUserPreferences(userId);

    if (accepted) {
      const acceptedRecs = prefs.acceptedRecommendations || [];
      if (!acceptedRecs.includes(recommendationId)) {
        acceptedRecs.push(recommendationId);
        await this.updatePreferences(userId, {
          acceptedRecommendations: acceptedRecs,
        });
      }
    } else {
      const dismissedRecs = prefs.dismissedRecommendations || [];
      if (!dismissedRecs.includes(recommendationId)) {
        dismissedRecs.push(recommendationId);
        await this.updatePreferences(userId, {
          dismissedRecommendations: dismissedRecs,
        });
      }
    }
  }

  /**
   * Get conversation context for AI (last N messages)
   */
  static async getConversationContext(
    sessionId: string,
    limit: number = 10
  ): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const messages = await db
      .select()
      .from(conversationHistory)
      .where(eq(conversationHistory.sessionId, sessionId))
      .orderBy(desc(conversationHistory.createdAt))
      .limit(limit);

    return messages
      .reverse()
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));
  }

  /**
   * Archive old conversations (30+ days)
   */
  static async archiveOldConversations(): Promise<number> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // In a real implementation, you'd move these to an archive table
    // For now, we'll just mark them as ended
    const result = await db
      .update(conversationSessions)
      .set({ endedAt: new Date() })
      .where(
        and(
          eq(conversationSessions.endedAt, null as any),
          // @ts-ignore - timestamp comparison
          conversationSessions.startedAt < thirtyDaysAgo
        )
      );

    return 0; // Would return count of archived records
  }

  /**
   * Search conversations by content
   */
  static async searchConversations(
    userId: number,
    query: string,
    limit: number = 20
  ) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Simple search - in production, use full-text search
    const messages = await db
      .select()
      .from(conversationHistory)
      .where(eq(conversationHistory.userId, userId))
      .orderBy(desc(conversationHistory.createdAt))
      .limit(limit * 2); // Get more to filter

    return messages
      .filter((msg) =>
        msg.content.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit);
  }

  /**
   * Clear user's conversation history
   */
  static async clearHistory(userId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Delete all messages
    await db
      .delete(conversationHistory)
      .where(eq(conversationHistory.userId, userId));

    // Delete all sessions
    await db
      .delete(conversationSessions)
      .where(eq(conversationSessions.userId, userId));
  }
}
