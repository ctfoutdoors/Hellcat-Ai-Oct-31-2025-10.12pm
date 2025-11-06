/**
 * AI-Powered Inventory Analytics Service
 * Provides intelligent insights, forecasting, and optimization recommendations
 */

import { invokeLLM } from "../_core/llm";

export interface DemandForecast {
  productId: number;
  forecastPeriodDays: number;
  predictedDemand: number;
  confidence: number;
  trend: "increasing" | "decreasing" | "stable";
  seasonalFactor: number;
  recommendation: string;
}

export interface ReorderRecommendation {
  productId: number;
  currentStock: number;
  reorderPoint: number;
  suggestedOrderQuantity: number;
  urgency: "critical" | "high" | "medium" | "low";
  daysUntilStockout: number;
  reasoning: string;
}

export interface ProductVelocity {
  productId: number;
  dailyAverageSales: number;
  weeklyAverageSales: number;
  monthlyAverageSales: number;
  turnoverRate: number;
  daysToSell: number;
  velocityTrend: "accelerating" | "stable" | "declining";
}

export interface DeadStockAlert {
  productId: number;
  sku: string;
  name: string;
  daysSinceLastSale: number;
  currentStock: number;
  inventoryValue: number;
  recommendation: "discount" | "bundle" | "clearance" | "return_to_supplier";
  suggestedAction: string;
}

/**
 * Calculate optimal reorder point using AI-enhanced Wilson Formula
 * Takes into account: lead time, demand variability, service level, seasonality
 */
export async function calculateReorderPoint(params: {
  productId: number;
  averageDailySales: number;
  leadTimeDays: number;
  demandVariability: number;
  serviceLevel?: number; // Default 95%
  historicalData?: Array<{ date: string; quantity: number }>;
}): Promise<ReorderRecommendation> {
  const {
    productId,
    averageDailySales,
    leadTimeDays,
    demandVariability,
    serviceLevel = 0.95,
    historicalData = [],
  } = params;

  // Safety stock calculation: Z-score * sqrt(lead time) * demand std dev
  const zScore = serviceLevel === 0.95 ? 1.65 : serviceLevel === 0.99 ? 2.33 : 1.28;
  const safetyStock = Math.ceil(zScore * Math.sqrt(leadTimeDays) * demandVariability);

  // Base reorder point: (average daily sales * lead time) + safety stock
  const baseReorderPoint = Math.ceil(averageDailySales * leadTimeDays + safetyStock);

  // Economic Order Quantity (EOQ) for suggested order quantity
  const annualDemand = averageDailySales * 365;
  const orderingCost = 50; // Assumed cost per order
  const holdingCostPercent = 0.25; // 25% of product cost per year
  const assumedUnitCost = 10; // Will be replaced with actual cost
  const eoq = Math.ceil(
    Math.sqrt((2 * annualDemand * orderingCost) / (assumedUnitCost * holdingCostPercent))
  );

  // Use AI to analyze historical patterns and adjust recommendation
  let aiAdjustment = 1.0;
  let reasoning = `Standard reorder calculation: ${baseReorderPoint} units (${safetyStock} safety stock).`;

  if (historicalData.length >= 30) {
    try {
      const aiAnalysis = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are an inventory optimization expert. Analyze sales patterns and provide reorder recommendations.",
          },
          {
            role: "user",
            content: `Analyze this product's sales history and recommend reorder adjustments:
            
Product ID: ${productId}
Average Daily Sales: ${averageDailySales}
Lead Time: ${leadTimeDays} days
Calculated Reorder Point: ${baseReorderPoint}
Suggested Order Quantity (EOQ): ${eoq}

Recent Sales Data (last 30 days):
${historicalData.slice(-30).map((d) => `${d.date}: ${d.quantity} units`).join("\n")}

Provide:
1. Adjustment factor (0.8-1.5) to apply to reorder point
2. Brief reasoning for the adjustment
3. Any seasonal or trend observations

Format: {"adjustmentFactor": 1.2, "reasoning": "...", "observations": "..."}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "reorder_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                adjustmentFactor: {
                  type: "number",
                  description: "Multiplier to apply to base reorder point (0.8-1.5)",
                },
                reasoning: { type: "string", description: "Explanation for the adjustment" },
                observations: {
                  type: "string",
                  description: "Seasonal or trend observations",
                },
              },
              required: ["adjustmentFactor", "reasoning", "observations"],
              additionalProperties: false,
            },
          },
        },
      });

      const analysis = JSON.parse(aiAnalysis.choices[0].message.content || "{}");
      aiAdjustment = Math.max(0.8, Math.min(1.5, analysis.adjustmentFactor || 1.0));
      reasoning += ` AI adjustment: ${(aiAdjustment * 100).toFixed(0)}%. ${analysis.reasoning}`;
    } catch (error) {
      console.error("AI reorder analysis failed:", error);
      // Fall back to standard calculation
    }
  }

  const finalReorderPoint = Math.ceil(baseReorderPoint * aiAdjustment);
  const suggestedOrderQuantity = Math.max(eoq, finalReorderPoint * 2); // At least 2x reorder point

  return {
    productId,
    currentStock: 0, // Will be filled by caller
    reorderPoint: finalReorderPoint,
    suggestedOrderQuantity,
    urgency: "medium",
    daysUntilStockout: 0,
    reasoning,
  };
}

/**
 * Forecast demand for upcoming period using AI-enhanced time series analysis
 */
export async function forecastDemand(params: {
  productId: number;
  historicalSales: Array<{ date: string; quantity: number }>;
  forecastDays: number;
}): Promise<DemandForecast> {
  const { productId, historicalSales, forecastDays } = params;

  if (historicalSales.length < 14) {
    // Not enough data for meaningful forecast
    const avgDaily =
      historicalSales.reduce((sum, d) => sum + d.quantity, 0) / historicalSales.length;
    return {
      productId,
      forecastPeriodDays: forecastDays,
      predictedDemand: Math.ceil(avgDaily * forecastDays),
      confidence: 0.3,
      trend: "stable",
      seasonalFactor: 1.0,
      recommendation: "Insufficient historical data. Using simple average.",
    };
  }

  // Calculate basic statistics
  const recentData = historicalSales.slice(-30);
  const avgRecent = recentData.reduce((sum, d) => sum + d.quantity, 0) / recentData.length;
  const olderData = historicalSales.slice(-60, -30);
  const avgOlder =
    olderData.length > 0
      ? olderData.reduce((sum, d) => sum + d.quantity, 0) / olderData.length
      : avgRecent;

  const trendDirection =
    avgRecent > avgOlder * 1.1
      ? "increasing"
      : avgRecent < avgOlder * 0.9
        ? "decreasing"
        : "stable";

  try {
    // Use AI for sophisticated forecasting
    const aiResponse = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a demand forecasting expert. Analyze sales patterns and predict future demand.",
        },
        {
          role: "user",
          content: `Forecast demand for the next ${forecastDays} days based on this sales history:

${historicalSales.slice(-60).map((d) => `${d.date}: ${d.quantity}`).join("\n")}

Current trend: ${trendDirection}
Recent 30-day average: ${avgRecent.toFixed(2)}
Previous 30-day average: ${avgOlder.toFixed(2)}

Provide:
1. Predicted total demand for next ${forecastDays} days
2. Confidence level (0-1)
3. Seasonal factor if detected
4. Brief recommendation

Format: {"predictedDemand": 100, "confidence": 0.85, "seasonalFactor": 1.2, "recommendation": "..."}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "demand_forecast",
          strict: true,
          schema: {
            type: "object",
            properties: {
              predictedDemand: { type: "number" },
              confidence: { type: "number" },
              seasonalFactor: { type: "number" },
              recommendation: { type: "string" },
            },
            required: ["predictedDemand", "confidence", "seasonalFactor", "recommendation"],
            additionalProperties: false,
          },
        },
      },
    });

    const forecast = JSON.parse(aiResponse.choices[0].message.content || "{}");

    return {
      productId,
      forecastPeriodDays: forecastDays,
      predictedDemand: Math.ceil(forecast.predictedDemand),
      confidence: Math.max(0, Math.min(1, forecast.confidence)),
      trend: trendDirection,
      seasonalFactor: forecast.seasonalFactor,
      recommendation: forecast.recommendation,
    };
  } catch (error) {
    console.error("AI demand forecast failed:", error);
    // Fallback to simple linear projection
    const simpleForecast = avgRecent * forecastDays;
    return {
      productId,
      forecastPeriodDays: forecastDays,
      predictedDemand: Math.ceil(simpleForecast),
      confidence: 0.6,
      trend: trendDirection,
      seasonalFactor: 1.0,
      recommendation: "Using linear projection based on recent average sales.",
    };
  }
}

/**
 * Calculate product velocity metrics
 */
export function calculateVelocity(salesHistory: Array<{ date: string; quantity: number }>): ProductVelocity {
  const last7Days = salesHistory.slice(-7);
  const last30Days = salesHistory.slice(-30);
  const last90Days = salesHistory.slice(-90);

  const dailyAvg = last7Days.reduce((sum, d) => sum + d.quantity, 0) / Math.max(last7Days.length, 1);
  const weeklyAvg = last30Days.reduce((sum, d) => sum + d.quantity, 0) / Math.max(last30Days.length / 7, 1);
  const monthlyAvg = last90Days.reduce((sum, d) => sum + d.quantity, 0) / Math.max(last90Days.length / 30, 1);

  // Turnover rate: how many times inventory sells in a period
  const avgInventory = 100; // Placeholder, will be replaced with actual
  const turnoverRate = monthlyAvg / Math.max(avgInventory, 1);

  // Days to sell current inventory
  const daysToSell = avgInventory / Math.max(dailyAvg, 0.1);

  // Velocity trend
  const recentVelocity = dailyAvg;
  const olderVelocity = last30Days.slice(0, 7).reduce((sum, d) => sum + d.quantity, 0) / 7;
  const velocityTrend =
    recentVelocity > olderVelocity * 1.2
      ? "accelerating"
      : recentVelocity < olderVelocity * 0.8
        ? "declining"
        : "stable";

  return {
    productId: 0, // Will be set by caller
    dailyAverageSales: dailyAvg,
    weeklyAverageSales: weeklyAvg,
    monthlyAverageSales: monthlyAvg,
    turnoverRate,
    daysToSell,
    velocityTrend,
  };
}

/**
 * Identify dead stock that needs attention
 */
export async function identifyDeadStock(params: {
  products: Array<{
    id: number;
    sku: string;
    name: string;
    cost: number;
    currentStock: number;
    lastSaleDate: string | null;
  }>;
}): Promise<DeadStockAlert[]> {
  const { products } = params;
  const alerts: DeadStockAlert[] = [];
  const now = new Date();

  for (const product of products) {
    if (!product.lastSaleDate || product.currentStock === 0) continue;

    const lastSale = new Date(product.lastSaleDate);
    const daysSinceLastSale = Math.floor((now.getTime() - lastSale.getTime()) / (1000 * 60 * 60 * 24));

    // Consider dead stock if no sales in 90+ days and significant inventory
    if (daysSinceLastSale >= 90 && product.currentStock > 10) {
      const inventoryValue = product.cost * product.currentStock;

      let recommendation: DeadStockAlert["recommendation"] = "discount";
      let suggestedAction = "Consider 20-30% discount to move inventory.";

      if (daysSinceLastSale > 180) {
        recommendation = "clearance";
        suggestedAction = "Deep clearance sale (50%+ off) or donate for tax write-off.";
      } else if (daysSinceLastSale > 120) {
        recommendation = "bundle";
        suggestedAction = "Bundle with popular items or create promotional package.";
      }

      if (inventoryValue > 1000 && daysSinceLastSale > 120) {
        recommendation = "return_to_supplier";
        suggestedAction = "Contact supplier about return/exchange if possible.";
      }

      alerts.push({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        daysSinceLastSale,
        currentStock: product.currentStock,
        inventoryValue,
        recommendation,
        suggestedAction,
      });
    }
  }

  return alerts.sort((a, b) => b.inventoryValue - a.inventoryValue);
}

/**
 * Predict shipping/lead time based on supplier performance
 */
export function predictLeadTime(params: {
  supplierName: string;
  historicalLeadTimes: number[];
  standardLeadTime: number;
}): { predictedDays: number; confidence: number; recommendation: string } {
  const { historicalLeadTimes, standardLeadTime } = params;

  if (historicalLeadTimes.length === 0) {
    return {
      predictedDays: standardLeadTime,
      confidence: 0.5,
      recommendation: "No historical data. Using standard lead time.",
    };
  }

  // Calculate statistics
  const avg = historicalLeadTimes.reduce((sum, t) => sum + t, 0) / historicalLeadTimes.length;
  const variance =
    historicalLeadTimes.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / historicalLeadTimes.length;
  const stdDev = Math.sqrt(variance);

  // Predicted lead time with 95% confidence (mean + 1.65 * std dev)
  const predictedDays = Math.ceil(avg + 1.65 * stdDev);

  // Confidence based on consistency
  const confidence = Math.max(0.3, Math.min(0.95, 1 - stdDev / avg));

  let recommendation = `Expected delivery in ${predictedDays} days.`;
  if (stdDev > avg * 0.3) {
    recommendation += " Note: Supplier has inconsistent delivery times. Consider buffer stock.";
  }

  return { predictedDays, confidence, recommendation };
}
