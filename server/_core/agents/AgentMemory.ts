import { getDb } from '../../db';
import { aiAgentConversations, aiLearningData, type AIAgentConversation } from '../../../drizzle/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

/**
 * Agent Memory System
 * 
 * Provides extended memory and context persistence for AI agents.
 * Enables agents to:
 * - Remember previous conversations
 * - Build on past knowledge
 * - Reference historical decisions
 * - Learn from outcomes
 * - Maintain context across sessions
 */
export class AgentMemory {
  /**
   * Retrieve conversation history for an agent
   */
  static async getConversationHistory(
    agentId: number,
    options: {
      limit?: number;
      entityType?: string;
      entityId?: number;
      since?: Date;
    } = {}
  ): Promise<AIAgentConversation[]> {
    const db = await getDb();
    if (!db) return [];
    
    let query = db
      .select()
      .from(aiAgentConversations)
      .where(eq(aiAgentConversations.agentId, agentId))
      .orderBy(desc(aiAgentConversations.createdAt));
    
    // Apply filters
    if (options.entityType && options.entityId) {
      query = query.where(
        and(
          eq(aiAgentConversations.entityType, options.entityType),
          eq(aiAgentConversations.entityId, options.entityId)
        )
      );
    }
    
    if (options.since) {
      query = query.where(
        sql`${aiAgentConversations.createdAt} >= ${options.since}`
      );
    }
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    return await query;
  }
  
  /**
   * Build context string from conversation history
   */
  static async buildContextString(
    agentId: number,
    options: {
      maxConversations?: number;
      entityType?: string;
      entityId?: number;
      includeTimestamps?: boolean;
    } = {}
  ): Promise<string> {
    const conversations = await this.getConversationHistory(agentId, {
      limit: options.maxConversations || 10,
      entityType: options.entityType,
      entityId: options.entityId,
    });
    
    if (conversations.length === 0) {
      return 'No previous conversation history.';
    }
    
    const contextParts: string[] = ['=== PREVIOUS CONVERSATION HISTORY ===\n'];
    
    for (const conv of conversations.reverse()) {
      const timestamp = options.includeTimestamps
        ? `[${conv.createdAt.toISOString()}] `
        : '';
      
      const messages = conv.messages as any[];
      if (messages && Array.isArray(messages)) {
        for (const msg of messages) {
          const role = msg.role === 'user' ? 'USER' : 'AGENT';
          contextParts.push(`${timestamp}${role}: ${msg.content}\n`);
        }
      }
      
      contextParts.push('---\n');
    }
    
    contextParts.push('=== END CONVERSATION HISTORY ===\n');
    
    return contextParts.join('');
  }
  
  /**
   * Store a learning from an agent's experience
   */
  static async storeLearning(
    agentId: number,
    learning: {
      category: string;
      content: string;
      source: string;
      confidence: number;
      entityType?: string;
      entityId?: number;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    const db = await getDb();
    if (!db) return;
    
    await db.insert(aiLearningData).values({
      agentId,
      category: learning.category,
      content: learning.content,
      source: learning.source,
      confidence: learning.confidence,
      entityType: learning.entityType || null,
      entityId: learning.entityId || null,
      metadata: learning.metadata || null,
      isActive: true,
    });
  }
  
  /**
   * Retrieve relevant learnings for a topic/entity
   */
  static async getRelevantLearnings(
    agentId: number,
    options: {
      category?: string;
      entityType?: string;
      entityId?: number;
      minConfidence?: number;
      limit?: number;
    } = {}
  ): Promise<any[]> {
    const db = await getDb();
    if (!db) return [];
    
    let query = db
      .select()
      .from(aiLearningData)
      .where(
        and(
          eq(aiLearningData.agentId, agentId),
          eq(aiLearningData.isActive, true)
        )
      )
      .orderBy(desc(aiLearningData.confidence), desc(aiLearningData.createdAt));
    
    if (options.category) {
      query = query.where(eq(aiLearningData.category, options.category));
    }
    
    if (options.entityType && options.entityId) {
      query = query.where(
        and(
          eq(aiLearningData.entityType, options.entityType),
          eq(aiLearningData.entityId, options.entityId)
        )
      );
    }
    
    if (options.minConfidence) {
      query = query.where(
        sql`${aiLearningData.confidence} >= ${options.minConfidence}`
      );
    }
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    return await query;
  }
  
  /**
   * Build learnings context string
   */
  static async buildLearningsContext(
    agentId: number,
    options: {
      category?: string;
      entityType?: string;
      entityId?: number;
      limit?: number;
    } = {}
  ): Promise<string> {
    const learnings = await this.getRelevantLearnings(agentId, {
      ...options,
      minConfidence: 0.6,
      limit: options.limit || 20,
    });
    
    if (learnings.length === 0) {
      return '';
    }
    
    const contextParts: string[] = ['\n=== RELEVANT LEARNINGS & INSIGHTS ===\n'];
    
    for (const learning of learnings) {
      contextParts.push(
        `[${learning.category}] (Confidence: ${(learning.confidence * 100).toFixed(0)}%)\n` +
        `${learning.content}\n` +
        `Source: ${learning.source}\n---\n`
      );
    }
    
    contextParts.push('=== END LEARNINGS ===\n');
    
    return contextParts.join('');
  }
  
  /**
   * Get comprehensive context for an agent task
   */
  static async getComprehensiveContext(
    agentId: number,
    options: {
      entityType?: string;
      entityId?: number;
      includeConversations?: boolean;
      includeLearnings?: boolean;
      maxConversations?: number;
      maxLearnings?: number;
    } = {}
  ): Promise<string> {
    const contextParts: string[] = [];
    
    // Add conversation history
    if (options.includeConversations !== false) {
      const conversationContext = await this.buildContextString(agentId, {
        maxConversations: options.maxConversations || 5,
        entityType: options.entityType,
        entityId: options.entityId,
        includeTimestamps: true,
      });
      contextParts.push(conversationContext);
    }
    
    // Add learnings
    if (options.includeLearnings !== false) {
      const learningsContext = await this.buildLearningsContext(agentId, {
        entityType: options.entityType,
        entityId: options.entityId,
        limit: options.maxLearnings || 10,
      });
      if (learningsContext) {
        contextParts.push(learningsContext);
      }
    }
    
    return contextParts.join('\n');
  }
  
  /**
   * Summarize long conversation history
   */
  static summarizeContext(fullContext: string, maxLength: number = 4000): string {
    if (fullContext.length <= maxLength) {
      return fullContext;
    }
    
    // Take most recent context
    const lines = fullContext.split('\n');
    const recentLines: string[] = [];
    let currentLength = 0;
    
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (currentLength + line.length > maxLength) {
        break;
      }
      recentLines.unshift(line);
      currentLength += line.length;
    }
    
    return '[Context truncated to most recent interactions]\n\n' + recentLines.join('\n');
  }
}
