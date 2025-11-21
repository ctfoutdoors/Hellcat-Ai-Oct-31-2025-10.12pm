import { BaseAgent } from '../BaseAgent';
import type { AIAgent } from '../../../../drizzle/schema';

/**
 * Financial Analyst Agent - CFO Team Specialist
 * 
 * Responsibilities:
 * - Real-time financial data analysis
 * - Revenue and expense tracking
 * - Trend analysis and forecasting
 * - Financial reporting
 * - Budget variance analysis
 * - KPI monitoring
 */
export class FinancialAnalystAgent extends BaseAgent {
  constructor(agentData: AIAgent) {
    super(agentData);
  }
  
  /**
   * Get default system prompt for Financial Analyst
   */
  protected getDefaultSystemPrompt(): string {
    return `You are a Financial Analyst specialist agent reporting to the CFO.

Your primary responsibilities:
1. **Real-Time Analysis**: Monitor and analyze financial data as it comes in
2. **Revenue Analysis**: Track revenue streams, identify trends, and forecast future performance
3. **Expense Analysis**: Monitor spending patterns and identify cost optimization opportunities
4. **Variance Analysis**: Compare actual vs. budget and explain significant variances
5. **KPI Tracking**: Monitor key financial metrics and alert on anomalies
6. **Reporting**: Generate clear, actionable financial insights

Your expertise includes:
- Financial statement analysis
- Ratio analysis and financial modeling
- Trend identification and forecasting
- Budget vs. actual analysis
- Cash flow analysis
- Profitability analysis by channel/product/customer

When analyzing financial data:
- Provide specific numbers and percentages
- Identify trends (up/down, accelerating/decelerating)
- Compare to historical performance
- Highlight anomalies or concerns
- Recommend specific actions
- Use clear, business-friendly language

Always support your analysis with data and provide actionable recommendations.`;
  }
  
  /**
   * Analyze revenue trends
   */
  async analyzeRevenue(data: {
    currentRevenue: number;
    previousRevenue: number;
    revenueByChannel?: Record<string, number>;
    revenueByProduct?: Record<string, number>;
    timeframe: string;
  }): Promise<any> {
    const taskDescription = `
Analyze revenue performance:

Current period revenue: $${data.currentRevenue.toLocaleString()}
Previous period revenue: $${data.previousRevenue.toLocaleString()}
Timeframe: ${data.timeframe}

${data.revenueByChannel ? `
Revenue by channel:
${Object.entries(data.revenueByChannel).map(([channel, amount]) => `- ${channel}: $${amount.toLocaleString()}`).join('\n')}
` : ''}

${data.revenueByProduct ? `
Revenue by product:
${Object.entries(data.revenueByProduct).map(([product, amount]) => `- ${product}: $${amount.toLocaleString()}`).join('\n')}
` : ''}

Provide:
1. Revenue growth rate and trend
2. Top performing channels/products
3. Underperforming areas
4. Forecast for next period
5. Risk factors
6. Recommended actions
    `.trim();
    
    return this.executeTask(taskDescription, {
      entity_type: 'revenue_analysis',
      data,
    });
  }
  
  /**
   * Analyze expenses
   */
  async analyzeExpenses(data: {
    totalExpenses: number;
    budgetedExpenses: number;
    expensesByCategory: Record<string, number>;
    timeframe: string;
  }): Promise<any> {
    const taskDescription = `
Analyze expense performance:

Total expenses: $${data.totalExpenses.toLocaleString()}
Budgeted expenses: $${data.budgetedExpenses.toLocaleString()}
Variance: $${(data.totalExpenses - data.budgetedExpenses).toLocaleString()} (${(((data.totalExpenses - data.budgetedExpenses) / data.budgetedExpenses) * 100).toFixed(1)}%)
Timeframe: ${data.timeframe}

Expenses by category:
${Object.entries(data.expensesByCategory).map(([category, amount]) => `- ${category}: $${amount.toLocaleString()}`).join('\n')}

Provide:
1. Budget variance analysis
2. Categories over/under budget
3. Spending trends
4. Cost optimization opportunities
5. Risk areas (overspending)
6. Recommended actions
    `.trim();
    
    return this.executeTask(taskDescription, {
      entity_type: 'expense_analysis',
      data,
    });
  }
  
  /**
   * Calculate and analyze financial KPIs
   */
  async analyzeKPIs(data: {
    revenue: number;
    expenses: number;
    grossProfit: number;
    orderCount: number;
    customerCount: number;
    inventoryValue: number;
  }): Promise<any> {
    const profitMargin = ((data.revenue - data.expenses) / data.revenue) * 100;
    const avgOrderValue = data.revenue / data.orderCount;
    const revenuePerCustomer = data.revenue / data.customerCount;
    
    const taskDescription = `
Analyze key financial KPIs:

Revenue: $${data.revenue.toLocaleString()}
Expenses: $${data.expenses.toLocaleString()}
Gross Profit: $${data.grossProfit.toLocaleString()}
Net Profit: $${(data.revenue - data.expenses).toLocaleString()}

Calculated KPIs:
- Profit Margin: ${profitMargin.toFixed(1)}%
- Average Order Value: $${avgOrderValue.toFixed(2)}
- Revenue per Customer: $${revenuePerCustomer.toFixed(2)}
- Order Count: ${data.orderCount}
- Customer Count: ${data.customerCount}
- Inventory Value: $${data.inventoryValue.toLocaleString()}

Provide:
1. KPI health assessment (good/concerning/critical)
2. Comparison to industry benchmarks
3. Trends and patterns
4. Areas of strength
5. Areas needing improvement
6. Strategic recommendations
    `.trim();
    
    return this.executeTask(taskDescription, {
      entity_type: 'kpi_analysis',
      data,
    });
  }
  
  /**
   * Generate financial forecast
   */
  async generateForecast(data: {
    historicalRevenue: number[];
    historicalExpenses: number[];
    seasonalFactors?: Record<string, number>;
    forecastPeriods: number;
  }): Promise<any> {
    const taskDescription = `
Generate financial forecast:

Historical revenue (last ${data.historicalRevenue.length} periods):
${data.historicalRevenue.map((rev, i) => `Period ${i + 1}: $${rev.toLocaleString()}`).join('\n')}

Historical expenses (last ${data.historicalExpenses.length} periods):
${data.historicalExpenses.map((exp, i) => `Period ${i + 1}: $${exp.toLocaleString()}`).join('\n')}

${data.seasonalFactors ? `
Seasonal factors:
${Object.entries(data.seasonalFactors).map(([period, factor]) => `${period}: ${factor}x`).join('\n')}
` : ''}

Forecast periods: ${data.forecastPeriods}

Provide:
1. Revenue forecast for next ${data.forecastPeriods} periods
2. Expense forecast for next ${data.forecastPeriods} periods
3. Profit forecast
4. Confidence level (high/medium/low)
5. Key assumptions
6. Risk factors that could impact forecast
    `.trim();
    
    return this.executeTask(taskDescription, {
      entity_type: 'financial_forecast',
      data,
    });
  }
  
  /**
   * Analyze profitability by segment
   */
  async analyzeProfitability(data: {
    segments: Array<{
      name: string;
      revenue: number;
      cost: number;
      orders: number;
    }>;
    segmentType: 'channel' | 'product' | 'customer' | 'region';
  }): Promise<any> {
    const taskDescription = `
Analyze profitability by ${data.segmentType}:

${data.segments.map((seg, i) => `
${i + 1}. ${seg.name}
   Revenue: $${seg.revenue.toLocaleString()}
   Cost: $${seg.cost.toLocaleString()}
   Profit: $${(seg.revenue - seg.cost).toLocaleString()}
   Margin: ${(((seg.revenue - seg.cost) / seg.revenue) * 100).toFixed(1)}%
   Orders: ${seg.orders}
   Avg Order Value: $${(seg.revenue / seg.orders).toFixed(2)}
`).join('\n')}

Provide:
1. Most profitable ${data.segmentType}s
2. Least profitable ${data.segmentType}s
3. Margin analysis and trends
4. Recommendations to improve profitability
5. ${data.segmentType}s to focus on
6. ${data.segmentType}s to reconsider
    `.trim();
    
    return this.executeTask(taskDescription, {
      entity_type: 'profitability_analysis',
      segment_type: data.segmentType,
      data,
    });
  }
}
