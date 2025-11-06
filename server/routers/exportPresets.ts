import { protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { ExportPresetsService } from '../services/exportPresets';

export const exportPresetsRouter = router({
  /**
   * Create new preset
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        entityType: z.enum(['cases', 'contacts', 'companies', 'deals', 'orders']),
        format: z.enum(['csv', 'json', 'excel']),
        fields: z.array(z.string()),
        filters: z.record(z.any()).optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
        includeRelations: z.array(z.string()).optional(),
        isPublic: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const preset = ExportPresetsService.createPreset({
        ...input,
        userId: ctx.user.id,
      });

      return {
        success: true,
        preset,
      };
    }),

  /**
   * Get preset by ID
   */
  getById: protectedProcedure
    .input(
      z.object({
        presetId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const preset = ExportPresetsService.getPreset(input.presetId);

      return {
        success: !!preset,
        preset,
      };
    }),

  /**
   * Get user's presets
   */
  getUserPresets: protectedProcedure
    .input(
      z.object({
        includePublic: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      const presets = ExportPresetsService.getUserPresets(
        ctx.user.id,
        input?.includePublic ?? true
      );

      return {
        success: true,
        presets,
      };
    }),

  /**
   * Get presets by entity type
   */
  getByEntity: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(['cases', 'contacts', 'companies', 'deals', 'orders']),
      })
    )
    .query(async ({ input, ctx }) => {
      const presets = ExportPresetsService.getPresetsByEntity(ctx.user.id, input.entityType);

      return {
        success: true,
        presets,
      };
    }),

  /**
   * Update preset
   */
  update: protectedProcedure
    .input(
      z.object({
        presetId: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        fields: z.array(z.string()).optional(),
        filters: z.record(z.any()).optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
        includeRelations: z.array(z.string()).optional(),
        isPublic: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { presetId, ...updates } = input;
      const preset = ExportPresetsService.updatePreset(presetId, updates);

      return {
        success: !!preset,
        preset,
      };
    }),

  /**
   * Delete preset
   */
  delete: protectedProcedure
    .input(
      z.object({
        presetId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const success = ExportPresetsService.deletePreset(input.presetId, ctx.user.id);

      return {
        success,
      };
    }),

  /**
   * Duplicate preset
   */
  duplicate: protectedProcedure
    .input(
      z.object({
        presetId: z.string(),
        newName: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const preset = ExportPresetsService.duplicatePreset(
        input.presetId,
        ctx.user.id,
        input.newName
      );

      return {
        success: !!preset,
        preset,
      };
    }),

  /**
   * Record usage
   */
  recordUsage: protectedProcedure
    .input(
      z.object({
        presetId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      ExportPresetsService.recordUsage(input.presetId);

      return {
        success: true,
      };
    }),

  /**
   * Get popular presets
   */
  getPopular: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const presets = ExportPresetsService.getPopularPresets(input?.limit);

      return {
        success: true,
        presets,
      };
    }),

  /**
   * Search presets
   */
  search: protectedProcedure
    .input(
      z.object({
        query: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const presets = ExportPresetsService.searchPresets(ctx.user.id, input.query);

      return {
        success: true,
        presets,
      };
    }),

  /**
   * Get default presets
   */
  getDefaults: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(['cases', 'contacts', 'companies', 'deals', 'orders']),
      })
    )
    .query(async ({ input }) => {
      const presets = ExportPresetsService.getDefaultPresets(input.entityType);

      return {
        success: true,
        presets,
      };
    }),

  /**
   * Validate preset
   */
  validate: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        entityType: z.enum(['cases', 'contacts', 'companies', 'deals', 'orders']).optional(),
        format: z.enum(['csv', 'json', 'excel']).optional(),
        fields: z.array(z.string()).optional(),
      })
    )
    .query(async ({ input }) => {
      const result = ExportPresetsService.validatePreset(input);

      return result;
    }),

  /**
   * Get statistics
   */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const stats = ExportPresetsService.getStats(ctx.user.id);

      return {
        success: true,
        stats,
      };
    }),
});
