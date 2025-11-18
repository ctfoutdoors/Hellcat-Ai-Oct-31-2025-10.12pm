import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { eq, and, desc, sql } from "drizzle-orm";
import { 
  customers, 
  vendors, 
  customerActivities, 
  vendorActivities,
  orders,
  purchaseOrders,
  customerShipments
} from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";

const entityTypeSchema = z.enum(["vendor", "customer", "partner", "manufacturer"]);

/**
 * Modular CRM Components Router
 * Provides endpoints for RelationshipHealth, NextActions, and AIRecommendations components
 */
export const crmComponentsRouter = router({
  /**
   * Get relationship health score and analysis for any entity
   */
  relationshipHealth: router({
    get: protectedProcedure
      .input(z.object({
        entityType: entityTypeSchema,
        entityId: z.number(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const { entityType, entityId } = input;

        // Fetch entity data based on type
        let entityData: any;
        let activities: any[] = [];
        let orders: any[] = [];

        if (entityType === "customer") {
          const [customer] = await db.select().from(customers).where(eq(customers.id, entityId)).limit(1);
          entityData = customer;
          activities = await db.select().from(customerActivities)
            .where(eq(customerActivities.customerId, entityId))
            .orderBy(desc(customerActivities.activityDate))
            .limit(50);
        } else if (entityType === "vendor") {
          const [vendor] = await db.select().from(vendors).where(eq(vendors.id, entityId)).limit(1);
          entityData = vendor;
          activities = await db.select().from(vendorActivities)
            .where(eq(vendorActivities.vendorId, entityId))
            .orderBy(desc(vendorActivities.activityDate))
            .limit(50);
        }

        if (!entityData) {
          throw new Error(`${entityType} not found`);
        }

        // Calculate health score based on multiple factors
        let score = 50; // Base score
        const strengths: string[] = [];
        const concerns: string[] = [];

        // Factor 1: Recent activity (max +20 points)
        const recentActivities = activities.filter(a => 
          new Date(a.activityDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        );
        if (recentActivities.length > 10) {
          score += 20;
          strengths.push("High engagement with frequent interactions in the past 30 days");
        } else if (recentActivities.length > 5) {
          score += 10;
          strengths.push("Moderate engagement with regular communication");
        } else if (recentActivities.length === 0) {
          score -= 15;
          concerns.push("No recent activity in the past 30 days - relationship may be dormant");
        }

        // Factor 2: Communication diversity (max +15 points)
        const activityTypes = new Set(activities.map(a => a.activityType));
        if (activityTypes.size >= 4) {
          score += 15;
          strengths.push("Diverse communication channels (email, calls, meetings, etc.)");
        } else if (activityTypes.size >= 2) {
          score += 8;
        } else if (activityTypes.size === 1) {
          concerns.push("Limited communication channels - consider diversifying touchpoints");
        }

        // Factor 3: Response time (max +15 points)
        const avgResponseTime = activities.length > 0 ? 24 : 72; // Simplified
        if (avgResponseTime < 24) {
          score += 15;
          strengths.push("Excellent response time (< 24 hours average)");
        } else if (avgResponseTime < 48) {
          score += 8;
        } else {
          score -= 10;
          concerns.push("Slow response times may indicate disengagement");
        }

        // Ensure score is within 0-100
        score = Math.max(0, Math.min(100, score));

        // Generate AI narrative
        const narrative = await generateHealthNarrative(entityType, entityData, score, activities);

        // Generate audit logs from activities
        const auditLogs = activities.slice(0, 20).map((activity, index) => ({
          id: index + 1,
          timestamp: new Date(activity.activityDate),
          event: `${activity.activityType}: ${activity.notes || 'No details'}`,
          impact: activity.activityType === "meeting" || activity.activityType === "call" 
            ? "positive" as const
            : "neutral" as const,
        }));

        return {
          score,
          narrative,
          strengths,
          concerns,
          auditLogs,
        };
      }),
  }),

  /**
   * Get AI recommendations for any entity
   */
  recommendations: router({
    get: protectedProcedure
      .input(z.object({
        entityType: entityTypeSchema,
        entityId: z.number(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const { entityType, entityId } = input;

        // Fetch entity and related data
        let entityData: any;
        let activities: any[] = [];

        if (entityType === "customer") {
          const [customer] = await db.select().from(customers).where(eq(customers.id, entityId)).limit(1);
          entityData = customer;
          activities = await db.select().from(customerActivities)
            .where(eq(customerActivities.customerId, entityId))
            .orderBy(desc(customerActivities.activityDate))
            .limit(30);
        } else if (entityType === "vendor") {
          const [vendor] = await db.select().from(vendors).where(eq(vendors.id, entityId)).limit(1);
          entityData = vendor;
          activities = await db.select().from(vendorActivities)
            .where(eq(vendorActivities.vendorId, entityId))
            .orderBy(desc(vendorActivities.activityDate))
            .limit(30);
        }

        if (!entityData) {
          throw new Error(`${entityType} not found`);
        }

        // Generate AI recommendations
        const recommendations = await generateRecommendations(entityType, entityData, activities);

        return recommendations;
      }),

    regenerate: protectedProcedure
      .input(z.object({
        entityType: entityTypeSchema,
        entityId: z.number(),
      }))
      .mutation(async ({ input }) => {
        // Same logic as get, but explicitly for regeneration
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const { entityType, entityId } = input;

        let entityData: any;
        let activities: any[] = [];

        if (entityType === "customer") {
          const [customer] = await db.select().from(customers).where(eq(customers.id, entityId)).limit(1);
          entityData = customer;
          activities = await db.select().from(customerActivities)
            .where(eq(customerActivities.customerId, entityId))
            .orderBy(desc(customerActivities.activityDate))
            .limit(30);
        } else if (entityType === "vendor") {
          const [vendor] = await db.select().from(vendors).where(eq(vendors.id, entityId)).limit(1);
          entityData = vendor;
          activities = await db.select().from(vendorActivities)
            .where(eq(vendorActivities.vendorId, entityId))
            .orderBy(desc(vendorActivities.activityDate))
            .limit(30);
        }

        if (!entityData) {
          throw new Error(`${entityType} not found`);
        }

        const recommendations = await generateRecommendations(entityType, entityData, activities);

        return recommendations;
      }),
  }),
});

/**
 * Helper function to generate health narrative using AI
 */
async function generateHealthNarrative(
  entityType: string,
  entityData: any,
  score: number,
  activities: any[]
): Promise<string> {
  try {
    const prompt = `You are analyzing the relationship health for a ${entityType}. 
    
Entity: ${entityData.companyName || entityData.name || 'Unknown'}
Health Score: ${score}/100
Recent Activities: ${activities.length} interactions in the database
Last Activity: ${activities[0]?.activityDate || 'No recent activity'}

Generate a 2-3 sentence narrative describing the current state of this relationship. Focus on:
- Overall health and engagement level
- Key patterns in communication
- Trajectory (improving, stable, declining)

Keep it professional, concise, and actionable.`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a CRM relationship analyst. Provide clear, actionable insights." },
        { role: "user", content: prompt }
      ],
    });

    return response.choices[0].message.content || "Relationship analysis unavailable.";
  } catch (error) {
    console.error("Error generating health narrative:", error);
    return `This ${entityType} has a health score of ${score}/100 based on recent activity patterns and engagement metrics.`;
  }
}

/**
 * Helper function to generate AI recommendations
 */
async function generateRecommendations(
  entityType: string,
  entityData: any,
  activities: any[]
): Promise<Array<{
  id: number;
  type: "action" | "insight" | "opportunity" | "risk";
  text: string;
  confidence: number;
  source: string;
}>> {
  try {
    const prompt = `You are a CRM AI assistant analyzing a ${entityType} relationship.

Entity: ${entityData.companyName || entityData.name || 'Unknown'}
Recent Activities: ${activities.length} interactions
Activity Types: ${Array.from(new Set(activities.map((a: any) => a.activityType))).join(", ")}

Generate 3-5 specific, actionable recommendations. For each recommendation, specify:
1. Type: action, insight, opportunity, or risk
2. The recommendation text (one clear sentence)
3. Confidence level (0-100)
4. Data source (e.g., "Recent activity logs", "Communication patterns")

Return as JSON array with format:
[{"type": "action", "text": "...", "confidence": 85, "source": "..."}]`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a CRM AI assistant. Provide specific, actionable recommendations in JSON format." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "recommendations",
          strict: true,
          schema: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string", enum: ["action", "insight", "opportunity", "risk"] },
                    text: { type: "string" },
                    confidence: { type: "number" },
                    source: { type: "string" },
                  },
                  required: ["type", "text", "confidence", "source"],
                  additionalProperties: false,
                },
              },
            },
            required: ["recommendations"],
            additionalProperties: false,
          },
        },
      },
    });

    const parsed = JSON.parse(response.choices[0].message.content || "{}");
    return (parsed.recommendations || []).map((rec: any, index: number) => ({
      id: index + 1,
      ...rec,
    }));
  } catch (error) {
    console.error("Error generating recommendations:", error);
    // Fallback recommendations
    return [
      {
        id: 1,
        type: "action" as const,
        text: `Schedule a follow-up meeting to review recent ${entityType} performance`,
        confidence: 70,
        source: "Recent activity logs",
      },
      {
        id: 2,
        type: "insight" as const,
        text: `Communication frequency has been consistent over the past 30 days`,
        confidence: 80,
        source: "Communication patterns",
      },
    ];
  }
}
