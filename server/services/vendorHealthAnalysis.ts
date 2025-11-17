import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { eq } from "drizzle-orm";

interface VendorHealthAnalysis {
  score: number;
  summary: string;
  recommendations: string[];
  strengths: string[];
  concerns: string[];
  trend: 'improving' | 'stable' | 'declining';
}

export async function analyzeVendorHealth(vendorId: number): Promise<VendorHealthAnalysis> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Import schemas
  const { vendors, vendorActivities, vendorActionItems, purchaseOrders, poLineItems } = 
    await import('../../drizzle/schema');

  // Fetch vendor data
  const [vendor] = await db
    .select()
    .from(vendors)
    .where(eq(vendors.id, vendorId))
    .limit(1);

  if (!vendor) throw new Error('Vendor not found');

  // Fetch activities
  const activities = await db
    .select()
    .from(vendorActivities)
    .where(eq(vendorActivities.vendorId, vendorId))
    .orderBy(vendorActivities.activityDate);

  // Fetch action items
  const actionItems = await db
    .select()
    .from(vendorActionItems)
    .where(eq(vendorActionItems.vendorId, vendorId));

  // Fetch purchase orders
  const orders = await db
    .select()
    .from(purchaseOrders)
    .where(eq(purchaseOrders.vendorId, vendorId))
    .orderBy(purchaseOrders.orderDate);

  // Build context for LLM
  const context = {
    vendor: {
      name: vendor.companyName,
      vendorNumber: vendor.vendorNumber,
      paymentTerms: vendor.paymentTerms,
      active: vendor.active,
    },
    activities: activities.map(a => ({
      type: a.activityType,
      subject: a.subject,
      description: a.description,
      direction: a.direction,
      outcome: a.outcome,
      date: a.activityDate,
    })),
    actionItems: actionItems.map(a => ({
      title: a.title,
      priority: a.priority,
      status: a.status,
      dueDate: a.dueDate,
    })),
    orders: orders.map(o => ({
      poNumber: o.poNumber,
      orderDate: o.orderDate,
      totalAmount: o.totalAmount,
      status: o.status,
      paymentStatus: o.paymentStatus,
      shipDate: o.shipDate,
      expectedDeliveryDate: o.expectedDeliveryDate,
      receivedDate: o.receivedDate,
    })),
    stats: {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      activeOrders: orders.filter(o => 
        o.status === 'pending' || o.status === 'confirmed' || o.status === 'shipped'
      ).length,
      overdueActionItems: actionItems.filter(a => 
        a.status !== 'completed' && a.dueDate && new Date(a.dueDate) < new Date()
      ).length,
    },
  };

  // Call LLM for analysis
  const prompt = `You are a vendor relationship analyst. Analyze the following vendor data and provide a comprehensive health assessment.

Vendor: ${context.vendor.name} (${context.vendor.vendorNumber})
Payment Terms: ${context.vendor.paymentTerms}
Active: ${context.vendor.active}

Statistics:
- Total Orders: ${context.stats.totalOrders}
- Total Spent: $${(context.stats.totalSpent / 100).toFixed(2)}
- Active Orders: ${context.stats.activeOrders}
- Overdue Action Items: ${context.stats.overdueActionItems}

Recent Activities (${context.activities.length}):
${context.activities.slice(-10).map(a => 
  `- ${a.date}: ${a.type} - ${a.subject} (${a.outcome || 'N/A'})`
).join('\n')}

Pending Action Items (${context.actionItems.filter(a => a.status !== 'completed').length}):
${context.actionItems.filter(a => a.status !== 'completed').map(a => 
  `- [${a.priority}] ${a.title} (Due: ${a.dueDate || 'No date'})`
).join('\n')}

Recent Orders (${context.orders.slice(-5).length}):
${context.orders.slice(-5).map(o => 
  `- PO ${o.poNumber}: $${(o.totalAmount / 100).toFixed(2)} - ${o.status} (${o.paymentStatus})`
).join('\n')}

Provide your analysis in JSON format with:
{
  "score": <number 0-100>,
  "summary": "<brief 1-2 sentence summary>",
  "recommendations": ["<actionable recommendation 1>", "<recommendation 2>", ...],
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "concerns": ["<concern 1>", "<concern 2>", ...],
  "trend": "<improving|stable|declining>"
}

Consider:
- Communication frequency and responsiveness
- Order fulfillment and delivery performance
- Payment history and terms compliance
- Outstanding action items and follow-ups
- Overall relationship trajectory`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a vendor relationship analyst. Respond only with valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "vendor_health_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              score: { type: "number", description: "Health score from 0-100" },
              summary: { type: "string", description: "Brief summary" },
              recommendations: { 
                type: "array", 
                items: { type: "string" },
                description: "Actionable recommendations"
              },
              strengths: { 
                type: "array", 
                items: { type: "string" },
                description: "Relationship strengths"
              },
              concerns: { 
                type: "array", 
                items: { type: "string" },
                description: "Areas of concern"
              },
              trend: { 
                type: "string", 
                enum: ["improving", "stable", "declining"],
                description: "Relationship trend"
              }
            },
            required: ["score", "summary", "recommendations", "strengths", "concerns", "trend"],
            additionalProperties: false
          }
        }
      }
    });

    const analysis = JSON.parse(response.choices[0].message.content);
    return analysis;

  } catch (error) {
    console.error('[VendorHealthAnalysis] LLM call failed:', error);
    
    // Fallback to rule-based analysis
    return calculateFallbackHealth(context);
  }
}

function calculateFallbackHealth(context: any): VendorHealthAnalysis {
  let score = 70; // Base score
  
  // Adjust based on activity
  if (context.activities.length > 10) score += 10;
  else if (context.activities.length < 3) score -= 15;
  
  // Adjust based on orders
  if (context.stats.activeOrders > 0) score += 5;
  if (context.stats.totalOrders > 5) score += 5;
  
  // Penalize for overdue items
  score -= context.stats.overdueActionItems * 5;
  
  // Check payment status
  const latePayments = context.orders.filter((o: any) => 
    o.paymentStatus === 'overdue'
  ).length;
  score -= latePayments * 10;
  
  // Ensure score is in range
  score = Math.max(0, Math.min(100, score));
  
  const trend = score >= 75 ? 'improving' : score >= 60 ? 'stable' : 'declining';
  
  return {
    score,
    summary: `Vendor relationship is ${trend} with ${context.stats.totalOrders} orders and ${context.activities.length} recorded interactions.`,
    recommendations: [
      context.stats.overdueActionItems > 0 ? "Address overdue action items immediately" : "Maintain current communication cadence",
      context.stats.activeOrders > 0 ? "Monitor active orders for on-time delivery" : "Consider placing new orders to maintain relationship",
      "Schedule quarterly business review"
    ],
    strengths: [
      context.stats.totalOrders > 5 ? "Consistent order history" : "Established relationship",
      context.activities.length > 5 ? "Regular communication" : "Active engagement"
    ],
    concerns: [
      context.stats.overdueActionItems > 0 ? `${context.stats.overdueActionItems} overdue action items` : null,
      latePayments > 0 ? "Payment delays detected" : null,
      context.activities.length < 3 ? "Limited communication history" : null
    ].filter(Boolean) as string[],
    trend
  };
}
