import { protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { VersionControlService } from '../services/versionControl';

export const versionControlRouter = router({
  /**
   * Get version history for case
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        caseId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const history = VersionControlService.getVersionHistory(input.caseId);
      return {
        success: true,
        history,
      };
    }),

  /**
   * Get specific version
   */
  getVersion: protectedProcedure
    .input(
      z.object({
        caseId: z.number(),
        version: z.number(),
      })
    )
    .query(async ({ input }) => {
      const version = VersionControlService.getVersion(input.caseId, input.version);
      return {
        success: !!version,
        version,
      };
    }),

  /**
   * Rollback to version
   */
  rollback: protectedProcedure
    .input(
      z.object({
        caseId: z.number(),
        targetVersion: z.number(),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = VersionControlService.rollbackToVersion({
        caseId: input.caseId,
        targetVersion: input.targetVersion,
        userId: ctx.user.id,
        userName: ctx.user.name || 'Unknown',
        comment: input.comment,
      });

      return result;
    }),

  /**
   * Compare versions
   */
  compareVersions: protectedProcedure
    .input(
      z.object({
        caseId: z.number(),
        versionA: z.number(),
        versionB: z.number(),
      })
    )
    .query(async ({ input }) => {
      const diffs = VersionControlService.compareVersions(
        input.caseId,
        input.versionA,
        input.versionB
      );

      return {
        success: true,
        diffs,
      };
    }),

  /**
   * Get changes since version
   */
  getChangesSince: protectedProcedure
    .input(
      z.object({
        caseId: z.number(),
        sinceVersion: z.number(),
      })
    )
    .query(async ({ input }) => {
      const changes = VersionControlService.getChangesSince(input.caseId, input.sinceVersion);

      return {
        success: true,
        changes,
      };
    }),

  /**
   * Search by tag
   */
  searchByTag: protectedProcedure
    .input(
      z.object({
        caseId: z.number(),
        tag: z.string(),
      })
    )
    .query(async ({ input }) => {
      const versions = VersionControlService.searchByTag(input.caseId, input.tag);

      return {
        success: true,
        versions,
      };
    }),

  /**
   * Get statistics
   */
  getStats: protectedProcedure
    .input(
      z.object({
        caseId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const stats = VersionControlService.getStats(input.caseId);

      return {
        success: true,
        stats,
      };
    }),

  /**
   * Export history
   */
  exportHistory: protectedProcedure
    .input(
      z.object({
        caseId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const historyJson = VersionControlService.exportHistory(input.caseId);

      return {
        success: true,
        historyJson,
      };
    }),
});
