import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { RadialMenuService, actionLibrary } from "../services/radialMenuService";

const radialMenuActionSchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.string(),
  color: z.string(),
  actionType: z.enum(["navigate", "api", "quickEdit", "export", "custom"]),
  actionConfig: z.any(),
  order: z.number(),
  enabled: z.boolean(),
  shortcut: z.string().optional(),
});

export const radialMenuRouter = router({
  /**
   * Get user's radial menu settings
   */
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    return RadialMenuService.getSettings(ctx.user.id);
  }),

  /**
   * Update radial menu settings
   */
  updateSettings: protectedProcedure
    .input(
      z.object({
        enabled: z.boolean().optional(),
        animationSpeed: z.number().optional(),
        radius: z.number().optional(),
        bubbleSize: z.number().optional(),
        casesPage: z.array(radialMenuActionSchema).optional(),
        caseDetail: z.array(radialMenuActionSchema).optional(),
        dashboard: z.array(radialMenuActionSchema).optional(),
        ordersPage: z.array(radialMenuActionSchema).optional(),
        productsPage: z.array(radialMenuActionSchema).optional(),
        auditsPage: z.array(radialMenuActionSchema).optional(),
        reportsPage: z.array(radialMenuActionSchema).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return RadialMenuService.updateSettings(ctx.user.id, input);
    }),

  /**
   * Reset context to defaults
   */
  resetContext: protectedProcedure
    .input(
      z.object({
        context: z.enum([
          "casesPage",
          "caseDetail",
          "dashboard",
          "ordersPage",
          "productsPage",
          "auditsPage",
          "reportsPage",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return RadialMenuService.resetContext(ctx.user.id, input.context);
    }),

  /**
   * Reset all settings to defaults
   */
  resetAll: protectedProcedure.mutation(async ({ ctx }) => {
    return RadialMenuService.resetAll(ctx.user.id);
  }),

  /**
   * Get available action library
   */
  getActionLibrary: protectedProcedure.query(async () => {
    return actionLibrary;
  }),
});
