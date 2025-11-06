import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { caseAssignment } from '../services/CaseAssignment';
import { getDb } from '../db';
import { teamMembers, assignmentRules, caseAssignments } from '../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';

export const caseAssignmentRouter = router({
  // Auto-assign a case
  autoAssign: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .mutation(async ({ input }) => {
      const teamMemberId = await caseAssignment.autoAssignCase(input.caseId);
      return { success: true, teamMemberId };
    }),

  // Manually assign case
  manualAssign: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      teamMemberId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      await caseAssignment.manualAssignCase(input.caseId, input.teamMemberId, ctx.user.id);
      return { success: true };
    }),

  // Reassign case
  reassign: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      newTeamMemberId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      await caseAssignment.reassignCase(input.caseId, input.newTeamMemberId, ctx.user.id);
      return { success: true };
    }),

  // Get team workload
  getTeamWorkload: protectedProcedure
    .query(async () => {
      const workload = await caseAssignment.getTeamWorkload();
      return workload;
    }),

  // Balance workload
  balanceWorkload: protectedProcedure
    .mutation(async () => {
      const count = await caseAssignment.balanceWorkload();
      return { success: true, rebalancedCount: count };
    }),

  // Get team members
  getTeamMembers: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      return await db.select().from(teamMembers).where(eq(teamMembers.isActive, true));
    }),

  // Get assignment rules
  getAssignmentRules: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      return await db.select().from(assignmentRules).orderBy(desc(assignmentRules.priority));
    }),

  // Get case assignments
  getCaseAssignments: protectedProcedure
    .input(z.object({
      caseId: z.number().optional(),
      teamMemberId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      let query = db.select().from(caseAssignments).orderBy(desc(caseAssignments.assignedAt));

      if (input.caseId) {
        query = query.where(eq(caseAssignments.caseId, input.caseId)) as any;
      }

      if (input.teamMemberId) {
        query = query.where(eq(caseAssignments.assignedTo, input.teamMemberId)) as any;
      }

      return await query;
    }),
});
