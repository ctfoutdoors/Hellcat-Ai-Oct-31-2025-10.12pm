import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import {
  getActiveSettings,
  getSettingsByVersion,
  createSettingsVersion,
  initializeSettings,
  getDefaultSettings,
} from "../services/intelligenceSettings";

/**
 * Intelligence Suite Router
 * Handles Settings, Product Intelligence, Launch Orchestrator, Mission Control
 */

export const intelligenceRouter = router({
  // ============================================================================
  // SETTINGS MODULE
  // ============================================================================

  settings: router({
    /**
     * Get active settings
     */
    getActive: protectedProcedure.query(async ({ ctx }) => {
      // Check if user is admin
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      let settings = await getActiveSettings();
      
      // Initialize if no settings exist
      if (!settings) {
        settings = await initializeSettings(ctx.user.id);
      }

      return settings;
    }),

    /**
     * Get settings by version
     */
    getByVersion: protectedProcedure
      .input(z.object({ version: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }

        return await getSettingsByVersion(input.version);
      }),

    /**
     * Get default settings template
     */
    getDefaults: protectedProcedure.query(({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      return getDefaultSettings();
    }),

    /**
     * Create new settings version
     */
    create: protectedProcedure
      .input(
        z.object({
          timingRules: z.object({
            assetDeadlineDays: z.number().optional(),
            copyDeadlineDays: z.number().optional(),
            freezeWindowDays: z.number().optional(),
            goNoGoTimingDays: z.number().optional(),
            reviewTimingDays: z.number().optional(),
            escalationDelayHours: z.number().optional(),
            syncFrequencyMinutes: z.number().optional(),
          }).optional(),
          thresholds: z.object({
            inventoryThresholds: z.record(z.number()).optional(),
            safetyStockMultiplier: z.number().optional(),
            variantReadinessMinScore: z.number().optional(),
            minimumApprovalQuorum: z.number().optional(),
          }).optional(),
          templates: z.object({
            defaultTasks: z.record(z.array(z.any())).optional(),
            defaultChecklists: z.array(z.any()).optional(),
            assetRequirements: z.array(z.any()).optional(),
            notificationRules: z.array(z.any()).optional(),
            phaseRequirements: z.array(z.any()).optional(),
            fallbackOwners: z.array(z.any()).optional(),
          }).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }

        return await createSettingsVersion(input, ctx.user.id);
      }),

    /**
     * Update settings (creates new version)
     */
    update: protectedProcedure
      .input(
        z.object({
          timingRules: z.object({
            assetDeadlineDays: z.number().optional(),
            copyDeadlineDays: z.number().optional(),
            freezeWindowDays: z.number().optional(),
            goNoGoTimingDays: z.number().optional(),
            reviewTimingDays: z.number().optional(),
            escalationDelayHours: z.number().optional(),
            syncFrequencyMinutes: z.number().optional(),
          }).optional(),
          thresholds: z.object({
            inventoryThresholds: z.record(z.number()).optional(),
            safetyStockMultiplier: z.number().optional(),
            variantReadinessMinScore: z.number().optional(),
            minimumApprovalQuorum: z.number().optional(),
          }).optional(),
          templates: z.object({
            defaultTasks: z.record(z.array(z.any())).optional(),
            defaultChecklists: z.array(z.any()).optional(),
            assetRequirements: z.array(z.any()).optional(),
            notificationRules: z.array(z.any()).optional(),
            phaseRequirements: z.array(z.any()).optional(),
            fallbackOwners: z.array(z.any()).optional(),
          }).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }

        // Get current settings to merge
        const current = await getActiveSettings();
        
        const merged = {
          timingRules: { ...(current?.timingRules || {}), ...(input.timingRules || {}) },
          thresholds: { ...(current?.thresholds || {}), ...(input.thresholds || {}) },
          templates: { ...(current?.templates || {}), ...(input.templates || {}) },
        };

        return await createSettingsVersion(merged, ctx.user.id);
      }),
  }),

  // ============================================================================
  // PRODUCT INTELLIGENCE MODULE
  // ============================================================================

  products: router({
    list: protectedProcedure.query(async () => {
      const { getAllProductsWithIntelligence } = await import("../services/productIntelligence");
      return await getAllProductsWithIntelligence();
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getProductIntelligence } = await import("../services/productIntelligence");
        return await getProductIntelligence(input.id);
      }),

    updateState: protectedProcedure
      .input(
        z.object({
          productId: z.number(),
          newState: z.enum(["concept", "development", "pre_launch", "active_launch", "post_launch", "cruise", "end_of_life"]),
        })
      )
      .mutation(async ({ input }) => {
        const { updateLifecycleState, getProductIntelligence, canTransitionTo } = await import("../services/productIntelligence");
        
        const product = await getProductIntelligence(input.productId);
        if (!product) throw new Error("Product not found");

        if (!canTransitionTo(product.lifecycleState as any, input.newState)) {
          throw new Error(`Cannot transition from ${product.lifecycleState} to ${input.newState}`);
        }

        return await updateLifecycleState(input.productId, input.newState);
      }),

    updateMetadata: protectedProcedure
      .input(
        z.object({
          productId: z.number(),
          assets: z.array(z.object({ type: z.string(), status: z.string(), url: z.string().optional() })).optional(),
          requirements: z.array(z.object({ name: z.string(), completed: z.boolean() })).optional(),
          blockers: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { updateIntelligenceMetadata } = await import("../services/productIntelligence");
        const { productId, ...metadata } = input;
        return await updateIntelligenceMetadata(productId, metadata);
      }),

    byState: protectedProcedure
      .input(z.object({ state: z.enum(["concept", "development", "pre_launch", "active_launch", "post_launch", "cruise", "end_of_life"]) }))
      .query(async ({ input }) => {
        const { getProductsByState } = await import("../services/productIntelligence");
        return await getProductsByState(input.state);
      }),

    needingAttention: protectedProcedure
      .input(z.object({ threshold: z.number().optional() }).optional())
      .query(async ({ input }) => {
        const { getProductsNeedingAttention } = await import("../services/productIntelligence");
        return await getProductsNeedingAttention(input?.threshold);
      }),
  }),

  // ============================================================================
  // LAUNCH ORCHESTRATOR MODULE
  // ============================================================================

  missions: router({
    list: protectedProcedure.query(async () => {
      const { getAllMissions } = await import("../services/launchOrchestrator");
      return await getAllMissions();
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getMissionById } = await import("../services/launchOrchestrator");
        return await getMissionById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          productId: z.number(),
          missionName: z.string(),
          launchDate: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { createMission } = await import("../services/launchOrchestrator");
        return await createMission({
          ...input,
          launchDate: new Date(input.launchDate),
          createdBy: ctx.user.id,
        });
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          missionId: z.number(),
          status: z.enum(["planning", "preparation", "review", "go_decision", "active", "completed", "aborted"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { updateMissionStatus } = await import("../services/launchOrchestrator");
        return await updateMissionStatus(input.missionId, input.status, ctx.user.id);
      }),

    updatePhase: protectedProcedure
      .input(
        z.object({
          missionId: z.number(),
          phase: z.enum(["pre_launch", "launch_day", "post_launch"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { updateMissionPhase } = await import("../services/launchOrchestrator");
        return await updateMissionPhase(input.missionId, input.phase, ctx.user.id);
      }),

    updateReadiness: protectedProcedure
      .input(
        z.object({
          missionId: z.number(),
          overallScore: z.number(),
          productScore: z.number(),
          variantScore: z.number(),
          inventoryScore: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const { updateReadinessSnapshot } = await import("../services/launchOrchestrator");
        const { missionId, ...snapshot } = input;
        return await updateReadinessSnapshot(missionId, snapshot);
      }),

    addCollaborator: protectedProcedure
      .input(
        z.object({
          missionId: z.number(),
          userId: z.number().optional(),
          name: z.string().optional(),
          email: z.string().optional(),
          role: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { addCollaborator } = await import("../services/launchOrchestrator");
        const { missionId, ...collaborator } = input;
        return await addCollaborator(missionId, collaborator, ctx.user.id);
      }),

    updateConfig: protectedProcedure
      .input(
        z.object({
          missionId: z.number(),
          phases: z.array(z.object({ name: z.string(), tasks: z.array(z.string()), deadline: z.string() })).optional(),
          checklists: z.array(z.object({ category: z.string(), items: z.array(z.object({ name: z.string(), completed: z.boolean() })) })).optional(),
          notifications: z.array(z.object({ event: z.string(), recipients: z.array(z.string()), template: z.string() })).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { updateMissionConfig } = await import("../services/launchOrchestrator");
        const { missionId, ...config } = input;
        return await updateMissionConfig(missionId, config, ctx.user.id);
      }),

    active: protectedProcedure.query(async () => {
      const { getActiveMissions } = await import("../services/launchOrchestrator");
      return await getActiveMissions();
    }),

    byStatus: protectedProcedure
      .input(z.object({ status: z.enum(["planning", "preparation", "review", "go_decision", "active", "completed", "aborted"]) }))
      .query(async ({ input }) => {
        const { getMissionsByStatus } = await import("../services/launchOrchestrator");
        return await getMissionsByStatus(input.status);
      }),
  }),
});
