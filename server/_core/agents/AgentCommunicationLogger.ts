import { getDb } from "../../db";
import { aiAgentCommunications, type InsertAgentCommunication } from "../../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * AgentCommunicationLogger
 * 
 * Tracks and logs all inter-agent communications, internal thoughts,
 * and decision-making processes for transparency and debugging.
 */
export class AgentCommunicationLogger {
  /**
   * Log a communication between agents
   */
  static async logCommunication(params: {
    conversationId: string;
    senderAgentId: number;
    receiverAgentId?: number;
    messageType: "request" | "response" | "broadcast" | "internal_thought" | "decision";
    content: string;
    context?: Record<string, unknown>;
    reasoning?: string;
    confidence?: number;
  }): Promise<void> {
    try {
      const db = await getDb();
      if (!db) {
        console.warn("[AgentCommunicationLogger] Database not available");
        return;
      }

      const communication: InsertAgentCommunication = {
        conversationId: params.conversationId,
        senderAgentId: params.senderAgentId,
        receiverAgentId: params.receiverAgentId ?? null,
        messageType: params.messageType,
        content: params.content,
        context: params.context ?? null,
        reasoning: params.reasoning ?? null,
        confidence: params.confidence ?? null,
      };

      await db.insert(aiAgentCommunications).values(communication);
      
      console.log(`[AgentComm] ${params.messageType.toUpperCase()}: Agent ${params.senderAgentId} → ${params.receiverAgentId ?? 'ALL'}: ${params.content.substring(0, 100)}...`);
    } catch (error) {
      console.error("[AgentCommunicationLogger] Error logging communication:", error);
    }
  }

  /**
   * Get all communications for a conversation
   */
  static async getConversation(conversationId: string) {
    try {
      const db = await getDb();
      if (!db) {
        console.warn("[AgentCommunicationLogger] Database not available");
        return [];
      }

      const communications = await db
        .select()
        .from(aiAgentCommunications)
        .where(eq(aiAgentCommunications.conversationId, conversationId))
        .orderBy(desc(aiAgentCommunications.createdAt));

      return communications;
    } catch (error) {
      console.error("[AgentCommunicationLogger] Error fetching conversation:", error);
      return [];
    }
  }

  /**
   * Get communications between two specific agents
   */
  static async getAgentDialogue(agentId1: number, agentId2: number) {
    try {
      const db = await getDb();
      if (!db) {
        console.warn("[AgentCommunicationLogger] Database not available");
        return [];
      }

      const communications = await db
        .select()
        .from(aiAgentCommunications)
        .where(
          and(
            eq(aiAgentCommunications.senderAgentId, agentId1),
            eq(aiAgentCommunications.receiverAgentId, agentId2)
          )
        )
        .orderBy(desc(aiAgentCommunications.createdAt));

      return communications;
    } catch (error) {
      console.error("[AgentCommunicationLogger] Error fetching agent dialogue:", error);
      return [];
    }
  }

  /**
   * Get recent communications for an agent
   */
  static async getAgentCommunications(agentId: number, limit: number = 50) {
    try {
      const db = await getDb();
      if (!db) {
        console.warn("[AgentCommunicationLogger] Database not available");
        return [];
      }

      const communications = await db
        .select()
        .from(aiAgentCommunications)
        .where(eq(aiAgentCommunications.senderAgentId, agentId))
        .orderBy(desc(aiAgentCommunications.createdAt))
        .limit(limit);

      return communications;
    } catch (error) {
      console.error("[AgentCommunicationLogger] Error fetching agent communications:", error);
      return [];
    }
  }
}
