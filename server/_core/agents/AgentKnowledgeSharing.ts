import { getDb } from '../../db';
import { aiLearningData, aiAgents, aiSharedKnowledge } from '../../../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * AgentKnowledgeSharing - Cross-agent knowledge sharing and collaboration system
 * 
 * Enables agents to:
 * - Share insights and learnings across departments
 * - Query knowledge from other agents
 * - Coordinate on cross-functional decisions
 * - Build collective intelligence
 */

export interface SharedKnowledge {
  id: number;
  agentId: number;
  agentName: string;
  agentRole: string;
  department: string;
  topic: string;
  insights: string;
  confidence: number;
  createdAt: Date;
}

export interface KnowledgeQuery {
  topic?: string;
  department?: string;
  agentRole?: string;
  minConfidence?: number;
  limit?: number;
}

export class AgentKnowledgeSharing {
  /**
   * Share knowledge/insights from an agent to the collective knowledge base
   */
  static async shareKnowledge(params: {
    agentId: number;
    topic: string;
    insights: string;
    department: string;
    confidence: number;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; knowledgeId?: number }> {
    try {
      const db = await getDb();
      if (!db) {
        return { success: false };
      }

      // Store knowledge in shared knowledge table
      const result = await db.insert(aiSharedKnowledge).values({
        agentId: params.agentId,
        topic: params.topic,
        insights: params.insights,
        department: params.department,
        confidence: params.confidence,
        createdAt: new Date(),
      });

      return {
        success: true,
        knowledgeId: result.insertId ? Number(result.insertId) : undefined,
      };
    } catch (error) {
      console.error('[AgentKnowledgeSharing] Error sharing knowledge:', error);
      return { success: false };
    }
  }

  /**
   * Query shared knowledge from other agents
   */
  static async queryKnowledge(query: KnowledgeQuery): Promise<SharedKnowledge[]> {
    try {
      const db = await getDb();
      if (!db) {
        return [];
      }

      // Query shared knowledge with agent details
      const results = await db
        .select({
          id: aiSharedKnowledge.id,
          agentId: aiSharedKnowledge.agentId,
          topic: aiSharedKnowledge.topic,
          insights: aiSharedKnowledge.insights,
          department: aiSharedKnowledge.department,
          confidence: aiSharedKnowledge.confidence,
          createdAt: aiSharedKnowledge.createdAt,
          agentName: aiAgents.name,
          agentRole: aiAgents.role,
        })
        .from(aiSharedKnowledge)
        .leftJoin(aiAgents, eq(aiSharedKnowledge.agentId, aiAgents.id))
        .orderBy(desc(aiSharedKnowledge.createdAt))
        .limit(query.limit || 50);

      // Filter results based on query parameters
      const knowledge: SharedKnowledge[] = results
        .filter((row) => {
          if (query.topic && !row.topic.toLowerCase().includes(query.topic.toLowerCase())) {
            return false;
          }
          if (query.department && row.department !== query.department) {
            return false;
          }
          if (query.agentRole && row.agentRole !== query.agentRole) {
            return false;
          }
          if (query.minConfidence && Number(row.confidence) < query.minConfidence) {
            return false;
          }
          return true;
        })
        .map((row) => ({
          id: row.id,
          agentId: row.agentId,
          agentName: row.agentName || 'Unknown Agent',
          agentRole: row.agentRole || 'unknown',
          department: row.department,
          topic: row.topic,
          insights: row.insights,
          confidence: Number(row.confidence),
          createdAt: row.createdAt,
        }));

      return knowledge;
    } catch (error) {
      console.error('[AgentKnowledgeSharing] Error querying knowledge:', error);
      return [];
    }
  }

  /**
   * Get knowledge shared by a specific agent
   */
  static async getAgentKnowledge(agentId: number, limit: number = 20): Promise<SharedKnowledge[]> {
    try {
      const db = await getDb();
      if (!db) {
        return [];
      }

      const results = await db
        .select()
        .from(aiLearningData)
        .where(
          and(
            eq(aiLearningData.agentId, agentId),
            eq(aiLearningData.dataType, 'shared_knowledge')
          )
        )
        .orderBy(desc(aiLearningData.createdAt))
        .limit(limit);

      const knowledge: SharedKnowledge[] = [];
      for (const row of results) {
        try {
          const content = JSON.parse(row.content as string);
          knowledge.push({
            id: row.id,
            agentId: row.agentId,
            agentName: content.agentName,
            agentRole: content.agentRole,
            department: content.department,
            topic: content.topic,
            insights: content.insights,
            confidence: content.confidence,
            createdAt: row.createdAt,
          });
        } catch (parseError) {
          console.error('[AgentKnowledgeSharing] Error parsing knowledge:', parseError);
        }
      }

      return knowledge;
    } catch (error) {
      console.error('[AgentKnowledgeSharing] Error getting agent knowledge:', error);
      return [];
    }
  }

  /**
   * Get knowledge by topic across all agents
   */
  static async getKnowledgeByTopic(topic: string, limit: number = 20): Promise<SharedKnowledge[]> {
    return this.queryKnowledge({ topic, limit });
  }

  /**
   * Get knowledge by department
   */
  static async getKnowledgeByDepartment(department: string, limit: number = 20): Promise<SharedKnowledge[]> {
    return this.queryKnowledge({ department, limit });
  }

  /**
   * Get cross-functional insights (knowledge from multiple departments)
   */
  static async getCrossFunctionalInsights(topic: string): Promise<{
    topic: string;
    departments: string[];
    insights: SharedKnowledge[];
  }> {
    const knowledge = await this.getKnowledgeByTopic(topic, 100);
    
    const departments = Array.from(new Set(knowledge.map(k => k.department)));
    
    return {
      topic,
      departments,
      insights: knowledge,
    };
  }
}
