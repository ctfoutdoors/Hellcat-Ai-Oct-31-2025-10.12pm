import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { AgentFactory } from '../_core/agents/AgentFactory';
import { getDb } from '../db';
import { aiAgents, aiAgentTasks, aiAgentConversations } from '../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { transcribeAudio } from '../_core/voiceTranscription';
import { TRPCError } from '@trpc/server';

export const aiAgentsRouter = router({
  /**
   * Initialize the core AI system (CEO + C-Suite)
   */
  initializeSystem: protectedProcedure.mutation(async ({ ctx }) => {
    const { ceo, cSuite } = await AgentFactory.initializeCoreAgents(ctx.user.id);
    
    return {
      success: true,
      ceo: {
        id: ceo.id,
        name: ceo.name,
        role: ceo.role,
      },
      cSuite: Object.entries(cSuite).map(([role, agent]) => ({
        id: agent.id,
        name: agent.name,
        role: agent.role,
      })),
    };
  }),
  
  /**
   * Get all agents
   */
  listAgents: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const agents = await db.select().from(aiAgents).orderBy(aiAgents.level, aiAgents.name);
    return agents;
  }),
  
  /**
   * Get agent by ID
   */
  getAgent: protectedProcedure
    .input(z.object({ agentId: z.number() }))
    .query(async ({ input }) => {
      const agent = await AgentFactory.getAgent(input.agentId);
      return agent;
    }),
  
  /**
   * Send command to Master Agent
   */
  commandMasterAgent: protectedProcedure
    .input(z.object({
      command: z.string(),
      context: z.record(z.any()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Get or create Master Agent
      const [ceoData] = await db.select().from(aiAgents).where(eq(aiAgents.role, 'ceo'));
      
      if (!ceoData) {
        throw new Error('Master Agent not initialized. Please initialize the AI system first.');
      }
      
      const masterAgent = await AgentFactory.getAgent(ceoData.id);
      if (!masterAgent) throw new Error('Failed to load Master Agent');
      
      // Execute command
      const result = await (masterAgent as any).processCommand(input.command, input.context);
      
      // Save conversation
      await db.insert(aiAgentConversations).values({
        participantAgentIds: [ceoData.id],
        userId: ctx.user.id,
        conversationType: 'user_command',
        messages: [
          {
            role: 'user',
            content: input.command,
            timestamp: new Date().toISOString(),
            modality: 'text',
          },
          {
            role: 'agent',
            agent_id: ceoData.id,
            content: result.output || result.error || 'No response',
            timestamp: new Date().toISOString(),
            modality: 'text',
          },
        ],
        status: 'completed',
      });
      
      return result;
    }),
  
  /**
   * Get agent conversations
   */
  getConversations: protectedProcedure
    .input(z.object({
      agentId: z.number().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return [];
      
      let query = db.select().from(aiAgentConversations)
        .where(eq(aiAgentConversations.userId, ctx.user.id))
        .orderBy(desc(aiAgentConversations.createdAt))
        .limit(input.limit);
      
      const conversations = await query;
      return conversations;
    }),
  
  /**
   * Get agent tasks
   */
  getTasks: protectedProcedure
    .input(z.object({
      agentId: z.number().optional(),
      status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled']).optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      let query = db.select().from(aiAgentTasks);
      
      if (input.agentId) {
        query = query.where(eq(aiAgentTasks.assignedToAgentId, input.agentId));
      }
      
      if (input.status) {
        query = query.where(eq(aiAgentTasks.status, input.status));
      }
      
      const tasks = await query.orderBy(desc(aiAgentTasks.createdAt)).limit(input.limit);
      return tasks;
    }),
  
  /**
   * Transcribe voice command to text using Whisper API
   */
  transcribeVoice: protectedProcedure
    .input(z.object({
      audioUrl: z.string(),
      language: z.string().optional(),
      prompt: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await transcribeAudio(input);
      
      // Check if it's an error
      if ('error' in result) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: result.error,
          cause: result,
        });
      }
      
      return result;
    }),
});
