import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { workflowEngine } from '../services/WorkflowEngine';
import { getDb } from '../db';
import {
  workflows,
  workflowExecutions,
  workflowExecutionSteps,
  workflowTemplates,
  workflowNodeTypes
} from '../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';

export const workflowsRouter = router({
  // Create a new workflow
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      type: z.enum(['CASE_LIFECYCLE', 'APPEAL_PROCESS', 'ESCALATION', 'CUSTOM']),
      nodes: z.array(z.any()),
      edges: z.array(z.any()),
      triggerType: z.enum(['MANUAL', 'CASE_CREATED', 'STATUS_CHANGE', 'TIME_BASED', 'WEBHOOK']).optional(),
      triggerConditions: z.any().optional(),
      isActive: z.boolean().optional(),
      tags: z.array(z.string()).optional(),
      category: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const result = await db.insert(workflows).values({
        name: input.name,
        description: input.description,
        type: input.type,
        nodes: JSON.stringify(input.nodes),
        edges: JSON.stringify(input.edges),
        triggerType: input.triggerType || 'MANUAL',
        triggerConditions: input.triggerConditions ? JSON.stringify(input.triggerConditions) : null,
        isActive: input.isActive ?? true,
        tags: input.tags ? JSON.stringify(input.tags) : null,
        category: input.category,
        createdBy: ctx.user.id,
      });

      return { success: true, workflowId: result[0].insertId };
    }),

  // Get all workflows
  list: protectedProcedure
    .input(z.object({
      type: z.enum(['CASE_LIFECYCLE', 'APPEAL_PROCESS', 'ESCALATION', 'CUSTOM']).optional(),
      isActive: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      let query = db.select().from(workflows).orderBy(desc(workflows.createdAt));

      if (input.type) {
        query = query.where(eq(workflows.type, input.type)) as any;
      }

      if (input.isActive !== undefined) {
        query = query.where(eq(workflows.isActive, input.isActive)) as any;
      }

      const results = await query;

      return results.map(w => ({
        ...w,
        nodes: JSON.parse(w.nodes),
        edges: JSON.parse(w.edges),
        tags: w.tags ? JSON.parse(w.tags) : [],
        triggerConditions: w.triggerConditions ? JSON.parse(w.triggerConditions) : null,
      }));
    }),

  // Get workflow by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const result = await db
        .select()
        .from(workflows)
        .where(eq(workflows.id, input.id))
        .limit(1);

      if (result.length === 0) return null;

      const workflow = result[0];

      return {
        ...workflow,
        nodes: JSON.parse(workflow.nodes),
        edges: JSON.parse(workflow.edges),
        tags: workflow.tags ? JSON.parse(workflow.tags) : [],
        triggerConditions: workflow.triggerConditions ? JSON.parse(workflow.triggerConditions) : null,
      };
    }),

  // Update workflow
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      nodes: z.array(z.any()).optional(),
      edges: z.array(z.any()).optional(),
      isActive: z.boolean().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const { id, ...updates } = input;

      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.description) updateData.description = updates.description;
      if (updates.nodes) updateData.nodes = JSON.stringify(updates.nodes);
      if (updates.edges) updateData.edges = JSON.stringify(updates.edges);
      if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
      if (updates.tags) updateData.tags = JSON.stringify(updates.tags);

      await db
        .update(workflows)
        .set(updateData)
        .where(eq(workflows.id, id));

      return { success: true };
    }),

  // Delete workflow
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db.delete(workflows).where(eq(workflows.id, input.id));

      return { success: true };
    }),

  // Execute workflow
  execute: protectedProcedure
    .input(z.object({
      workflowId: z.number(),
      caseId: z.number().optional(),
      variables: z.record(z.any()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const context = {
        caseId: input.caseId,
        userId: ctx.user.id,
        variables: input.variables || {},
      };

      const executionId = await workflowEngine.executeWorkflow(input.workflowId, context);

      return { success: true, executionId };
    }),

  // Get workflow executions
  getExecutions: protectedProcedure
    .input(z.object({
      workflowId: z.number().optional(),
      caseId: z.number().optional(),
      status: z.enum(['PENDING', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      let query = db.select().from(workflowExecutions).orderBy(desc(workflowExecutions.createdAt));

      if (input.workflowId) {
        query = query.where(eq(workflowExecutions.workflowId, input.workflowId)) as any;
      }

      if (input.caseId) {
        query = query.where(eq(workflowExecutions.caseId, input.caseId)) as any;
      }

      if (input.status) {
        query = query.where(eq(workflowExecutions.status, input.status)) as any;
      }

      const executions = await query;

      return executions.map(e => ({
        ...e,
        context: e.context ? JSON.parse(e.context) : null,
        output: e.output ? JSON.parse(e.output) : null,
        completedNodes: e.completedNodes ? JSON.parse(e.completedNodes) : [],
        failedNodes: e.failedNodes ? JSON.parse(e.failedNodes) : [],
      }));
    }),

  // Get execution details
  getExecutionDetails: protectedProcedure
    .input(z.object({ executionId: z.number() }))
    .query(async ({ input }) => {
      const status = await workflowEngine.getExecutionStatus(input.executionId);
      
      if (!status) return null;

      return {
        ...status.execution,
        context: status.execution.context ? JSON.parse(status.execution.context) : null,
        output: status.execution.output ? JSON.parse(status.execution.output) : null,
        steps: status.steps.map(s => ({
          ...s,
          input: s.input ? JSON.parse(s.input) : null,
          output: s.output ? JSON.parse(s.output) : null,
        })),
      };
    }),

  // Pause execution
  pauseExecution: protectedProcedure
    .input(z.object({ executionId: z.number() }))
    .mutation(async ({ input }) => {
      await workflowEngine.pauseExecution(input.executionId);
      return { success: true };
    }),

  // Resume execution
  resumeExecution: protectedProcedure
    .input(z.object({ executionId: z.number() }))
    .mutation(async ({ input }) => {
      await workflowEngine.resumeExecution(input.executionId);
      return { success: true };
    }),

  // Cancel execution
  cancelExecution: protectedProcedure
    .input(z.object({ executionId: z.number() }))
    .mutation(async ({ input }) => {
      await workflowEngine.cancelExecution(input.executionId);
      return { success: true };
    }),

  // Get workflow templates
  getTemplates: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const templates = await db
        .select()
        .from(workflowTemplates)
        .orderBy(desc(workflowTemplates.usageCount));

      return templates.map(t => ({
        ...t,
        nodes: JSON.parse(t.nodes),
        edges: JSON.parse(t.edges),
        tags: t.tags ? JSON.parse(t.tags) : [],
      }));
    }),

  // Create workflow from template
  createFromTemplate: protectedProcedure
    .input(z.object({
      templateId: z.number(),
      name: z.string(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Get template
      const templateResult = await db
        .select()
        .from(workflowTemplates)
        .where(eq(workflowTemplates.id, input.templateId))
        .limit(1);

      if (templateResult.length === 0) {
        throw new Error('Template not found');
      }

      const template = templateResult[0];

      // Create workflow from template
      const result = await db.insert(workflows).values({
        name: input.name,
        description: input.description || template.description,
        type: template.type,
        nodes: template.nodes,
        edges: template.edges,
        triggerType: 'MANUAL',
        isActive: true,
        createdBy: ctx.user.id,
      });

      // Increment template usage count
      await db
        .update(workflowTemplates)
        .set({ usageCount: template.usageCount + 1 })
        .where(eq(workflowTemplates.id, input.templateId));

      return { success: true, workflowId: result[0].insertId };
    }),

  // Initialize default workflow templates
  initializeTemplates: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const defaultTemplates = [
        {
          name: 'Standard Claim Filing',
          description: 'Complete workflow for filing a new claim: Generate letter → File claim → Track response → Record payment',
          type: 'CASE_LIFECYCLE' as const,
          nodes: JSON.stringify([
            { id: '1', type: 'START', data: { label: 'Start' }, position: { x: 100, y: 100 } },
            { id: '2', type: 'GENERATE_LETTER', data: { label: 'Generate Dispute Letter', tone: 'professional' }, position: { x: 100, y: 200 } },
            { id: '3', type: 'FILE_CLAIM', data: { label: 'File Claim to Portal' }, position: { x: 100, y: 300 } },
            { id: '4', type: 'UPDATE_STATUS', data: { label: 'Update Status to Filed', status: 'FILED' }, position: { x: 100, y: 400 } },
            { id: '5', type: 'CREATE_REMINDER', data: { label: 'Set 30-day Follow-up Reminder' }, position: { x: 100, y: 500 } },
            { id: '6', type: 'END', data: { label: 'End' }, position: { x: 100, y: 600 } },
          ]),
          edges: JSON.stringify([
            { id: 'e1-2', source: '1', target: '2' },
            { id: 'e2-3', source: '2', target: '3' },
            { id: 'e3-4', source: '3', target: '4' },
            { id: 'e4-5', source: '4', target: '5' },
            { id: 'e5-6', source: '5', target: '6' },
          ]),
          category: 'Claims',
          tags: JSON.stringify(['filing', 'standard', 'automated']),
          isPublic: true,
          isOfficial: true,
          createdBy: ctx.user.id,
        },
        {
          name: 'Appeal Denied Claim',
          description: 'Workflow for appealing a denied claim: Generate appeal letter → Re-file → Track',
          type: 'APPEAL_PROCESS' as const,
          nodes: JSON.stringify([
            { id: '1', type: 'START', data: { label: 'Start' }, position: { x: 100, y: 100 } },
            { id: '2', type: 'GENERATE_LETTER', data: { label: 'Generate Appeal Letter', tone: 'firm' }, position: { x: 100, y: 200 } },
            { id: '3', type: 'FILE_CLAIM', data: { label: 'Submit Appeal' }, position: { x: 100, y: 300 } },
            { id: '4', type: 'UPDATE_STATUS', data: { label: 'Update Status to Appealing', status: 'AWAITING_RESPONSE' }, position: { x: 100, y: 400 } },
            { id: '5', type: 'END', data: { label: 'End' }, position: { x: 100, y: 500 } },
          ]),
          edges: JSON.stringify([
            { id: 'e1-2', source: '1', target: '2' },
            { id: 'e2-3', source: '2', target: '3' },
            { id: 'e3-4', source: '3', target: '4' },
            { id: 'e4-5', source: '4', target: '5' },
          ]),
          category: 'Appeals',
          tags: JSON.stringify(['appeal', 'denial', 'escalation']),
          isPublic: true,
          isOfficial: true,
          createdBy: ctx.user.id,
        },
        {
          name: 'No Response Escalation',
          description: 'Escalate cases with no response after 30 days: Send follow-up → Escalate → Contact manager',
          type: 'ESCALATION' as const,
          nodes: JSON.stringify([
            { id: '1', type: 'START', data: { label: 'Start' }, position: { x: 100, y: 100 } },
            { id: '2', type: 'GENERATE_LETTER', data: { label: 'Generate Follow-up Letter', tone: 'firm' }, position: { x: 100, y: 200 } },
            { id: '3', type: 'SEND_EMAIL', data: { label: 'Send Follow-up Email' }, position: { x: 100, y: 300 } },
            { id: '4', type: 'WAIT', data: { label: 'Wait 7 Days', duration: 604800000 }, position: { x: 100, y: 400 } },
            { id: '5', type: 'GENERATE_LETTER', data: { label: 'Generate Escalation Letter', tone: 'escalated' }, position: { x: 100, y: 500 } },
            { id: '6', type: 'UPDATE_STATUS', data: { label: 'Mark as Escalated', status: 'AWAITING_RESPONSE' }, position: { x: 100, y: 600 } },
            { id: '7', type: 'END', data: { label: 'End' }, position: { x: 100, y: 700 } },
          ]),
          edges: JSON.stringify([
            { id: 'e1-2', source: '1', target: '2' },
            { id: 'e2-3', source: '2', target: '3' },
            { id: 'e3-4', source: '3', target: '4' },
            { id: 'e4-5', source: '4', target: '5' },
            { id: 'e5-6', source: '5', target: '6' },
            { id: 'e6-7', source: '6', target: '7' },
          ]),
          category: 'Escalation',
          tags: JSON.stringify(['escalation', 'no-response', 'follow-up']),
          isPublic: true,
          isOfficial: true,
          createdBy: ctx.user.id,
        },
      ];

      for (const template of defaultTemplates) {
        // Check if template already exists
        const existing = await db
          .select()
          .from(workflowTemplates)
          .where(eq(workflowTemplates.name, template.name))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(workflowTemplates).values(template);
        }
      }

      return { success: true, message: 'Workflow templates initialized' };
    }),
});
