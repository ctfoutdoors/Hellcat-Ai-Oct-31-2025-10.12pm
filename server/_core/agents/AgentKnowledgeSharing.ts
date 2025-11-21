import { getDb } from '../../db';
import { aiLearningData, aiAgents } from '../../../drizzle/schema';
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
    confidence: number;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; knowledgeId?: number }> {
    try {
      const db = await getDb();
      if (!db) {
        return { success: false };
      }

      // Get agent details
      const agent = await db.select().from(aiAgents).where(eq(aiAgents.id, params.agentId)).limit(1);
      if (!agent || agent.length === 0) {
        return { success: false };
      }

      // Store knowledge in learning data table
      const result = await db.insert(aiLearningData).values({
        agentId: params.agentId,
        dataType: 'shared_knowledge',
        content: JSON.stringify({
          topic: params.topic,
          insights: params.insights,
          confidence: params.confidence,
          agentName: agent[0].name,
          agentRole: agent[0].role,
          department: agent[0].department,
          metadata: params.metadata || {},
        }),
        source: 'agent_collaboration',
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

      // Build query for shared knowledge
      let dbQuery = db
        .select({
          id: aiLearningData.id,
          agentId: aiLearningData.agentId,
          content: aiLearningData.content,
          confidence: aiLearningData.confidence,
          createdAt: aiLearningData.createdAt,
        })
        .from(aiLearningData)
        .where(eq(aiLearningData.dataType, 'shared_knowledge'));

      // Apply confidence filter
      if (query.minConfidence) {
        dbQuery = dbQuery.where(
          and(
            eq(aiLearningData.dataType, 'shared_knowledge'),
            // Note: confidence comparison would need proper SQL expression
          )
        );
      }

      const results = await dbQuery
        .orderBy(desc(aiLearningData.createdAt))
        .limit(query.limit || 50);

      // Parse and filter results
      const knowledge: SharedKnowledge[] = [];
      for (const row of results) {
        try {
          const content = JSON.parse(row.content as string);
          
          // Apply filters
          if (query.topic && !content.topic.toLowerCase().includes(query.topic.toLowerCase())) {
            continue;
          }
          if (query.department && content.department !== query.department) {
            continue;
          }
          if (query.agentRole && content.agentRole !== query.agentRole) {
            continue;
          }
          if (query.minConfidence && content.confidence < query.minConfidence) {
            continue;
          }

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
