import { BaseAgent } from '../BaseAgent';
import type { AIAgent } from '../../../../drizzle/schema';

/**
 * Budget Manager Agent
 * 
 * Reports to: CFO
 * Department: Finance
 * 
 * Expertise:
 * - Budget planning and forecasting
 * - Variance analysis and reporting
 * - Resource allocation optimization
 * - Rolling forecasts and scenario planning
 * - Capital budgeting and ROI analysis
 * - Budget performance monitoring
 */
export class BudgetManagerAgent extends BaseAgent {
  constructor(agentData: AIAgent) {
    super(agentData);
  }
  
  /**
   * Get specialized system prompt for Budget Manager
   */
  protected getSpecializedPrompt(): string {
    return `You are a Budget Manager with PhD-level expertise in budgeting, forecasting, and financial planning & analysis (FP&A).

**CORE COMPETENCIES:**

1. **Budget Planning**
   - Zero-based budgeting (ZBB) methodologies
   - Incremental budgeting approaches
   - Activity-based budgeting (ABB)
   - Top-down vs. bottom-up budgeting
   - Multi-year strategic planning
   - Departmental budget allocation

2. **Forecasting**
   - Rolling forecasts (monthly, quarterly)
   - Statistical forecasting methods
   - Driver-based forecasting models
   - Scenario planning (best/base/worst case)
   - Sensitivity analysis
   - Predictive analytics and trend analysis

3. **Variance Analysis**
   - Actual vs. budget variance calculation
   - Favorable vs. unfavorable variance classification
   - Volume, price, and mix variance decomposition
   - Root cause analysis and corrective actions
   - Variance reporting and visualization
   - Trend identification and pattern recognition

4. **Resource Allocation**
   - Capital allocation frameworks
   - Project prioritization and scoring
   - Resource constraint optimization
   - Cost-benefit analysis
   - Return on investment (ROI) evaluation
   - Payback period and NPV calculations

5. **Performance Management**
   - KPI definition and tracking
   - Budget-to-actual monitoring
   - Flash reporting and early warning systems
   - Performance dashboards and scorecards
   - Incentive alignment with budget goals
   - Continuous improvement initiatives

**ANALYTICAL FRAMEWORKS:**

- **Variance Analysis**: Decompose variances into controllable vs. uncontrollable factors
- **Trend Analysis**: Identify patterns, seasonality, and anomalies in financial data
- **Ratio Analysis**: Efficiency ratios, spending ratios, and productivity metrics
- **What-If Analysis**: Model financial impacts of strategic decisions
- **Sensitivity Analysis**: Assess impact of key assumption changes on outcomes

**DELIVERABLES:**

- Comprehensive budget plans with assumptions and drivers
- Rolling forecast updates with commentary
- Variance analysis reports with actionable insights
- Scenario models for strategic decision support
- Capital allocation recommendations with ROI analysis
- Budget performance dashboards and KPI tracking

**COMMUNICATION STANDARDS:**

- Provide clear variance explanations with root causes
- Quantify financial impacts and materiality thresholds
- Flag budget risks and opportunities proactively
- Recommend specific corrective actions with timelines
- Use data visualization for complex financial data
- Align budget narratives with strategic objectives

Always deliver data-driven insights that enable informed decision-making and drive financial performance improvement.`;
  }
  
  /**
   * Analyze budget variances
   */
  async analyzeVariances(context: {
    period: string;
    budget_data: Record<string, number>;
    actual_data: Record<string, number>;
    threshold_percent?: number;
  }): Promise<string> {
    const threshold = context.threshold_percent || 5;
    
    const variances = Object.keys(context.budget_data).map(category => {
      const budget = context.budget_data[category] || 0;
      const actual = context.actual_data[category] || 0;
      const variance = actual - budget;
      const variance_percent = budget !== 0 ? (variance / budget) * 100 : 0;
      
      return {
        category,
        budget,
        actual,
        variance,
        variance_percent,
        significant: Math.abs(variance_percent) >= threshold
      };
    });
    
    const task = `Analyze budget variances for period ${context.period}.

Variance Summary:
${variances.map(v => 
  `- ${v.category}: Budget $${v.budget.toLocaleString()} | Actual $${v.actual.toLocaleString()} | Variance $${v.variance.toLocaleString()} (${v.variance_percent.toFixed(1)}%)${v.significant ? ' ⚠️ SIGNIFICANT' : ''}`
).join('\n')}

Materiality Threshold: ${threshold}%

Provide:
1. Executive summary of overall budget performance
2. Detailed analysis of significant variances (>${threshold}%)
3. Root cause analysis for each major variance
4. Favorable vs. unfavorable variance classification
5. Corrective actions for unfavorable variances
6. Forecast impact and recommendations`;

    const result = await this.executeTask(task, {
      entity_type: 'variance_analysis',
      entity_id: context.period,
    });
    
    return result.response;
  }
  
  /**
   * Create budget forecast
   */
  async createForecast(context: {
    forecast_period: string;
    historical_data: Array<{
      period: string;
      revenue: number;
      expenses: number;
      key_metrics: Record<string, number>;
    }>;
    assumptions: Record<string, any>;
    scenarios?: Array<'best_case' | 'base_case' | 'worst_case'>;
  }): Promise<string> {
    const task = `Create financial forecast for ${context.forecast_period}.

Historical Data (${context.historical_data.length} periods):
${context.historical_data.slice(-6).map(d => 
  `- ${d.period}: Revenue $${d.revenue.toLocaleString()} | Expenses $${d.expenses.toLocaleString()}`
).join('\n')}

Key Assumptions:
${Object.entries(context.assumptions).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Scenarios: ${context.scenarios?.join(', ') || 'Base Case'}

Provide:
1. Forecast methodology and key drivers
2. Revenue forecast by category/segment
3. Expense forecast by department/function
4. Cash flow forecast
5. Scenario analysis (if multiple scenarios requested)
6. Key risks and sensitivities
7. Confidence intervals and probability assessments`;

    const result = await this.executeTask(task, {
      entity_type: 'forecast',
      entity_id: context.forecast_period,
    });
    
    return result.response;
  }
  
  /**
   * Evaluate capital allocation requests
   */
  async evaluateCapitalAllocation(context: {
    requests: Array<{
      project_name: string;
      department: string;
      requested_amount: number;
      expected_roi: number;
      payback_period_months: number;
      strategic_priority: 'high' | 'medium' | 'low';
      description: string;
    }>;
    available_budget: number;
  }): Promise<string> {
    const totalRequested = context.requests.reduce((sum, r) => sum + r.requested_amount, 0);
    
    const task = `Evaluate capital allocation requests.

Available Budget: $${context.available_budget.toLocaleString()}
Total Requested: $${totalRequested.toLocaleString()}
${totalRequested > context.available_budget ? `⚠️ Over-subscribed by $${(totalRequested - context.available_budget).toLocaleString()}` : ''}

Requests (${context.requests.length} projects):
${context.requests.map(r => 
  `- ${r.project_name} (${r.department}): $${r.requested_amount.toLocaleString()}
  ROI: ${r.expected_roi}% | Payback: ${r.payback_period_months} months | Priority: ${r.strategic_priority}
  ${r.description}`
).join('\n\n')}

Provide:
1. Project-by-project evaluation with scoring
2. ROI and payback period analysis
3. Strategic alignment assessment
4. Risk evaluation for each project
5. Prioritized allocation recommendations
6. Alternative scenarios if budget constrained
7. Implementation sequencing and timing`;

    const result = await this.executeTask(task, {
      entity_type: 'capital_allocation',
    });
    
    return result.response;
  }
  
  /**
   * Monitor budget performance
   */
  async monitorPerformance(context: {
    period: string;
    departments: Array<{
      name: string;
      budget: number;
      actual: number;
      forecast: number;
    }>;
    kpis: Record<string, { target: number; actual: number; unit: string }>;
  }): Promise<string> {
    const task = `Monitor budget performance for period ${context.period}.

Department Performance:
${context.departments.map(d => {
  const variance = d.actual - d.budget;
  const variance_pct = d.budget !== 0 ? (variance / d.budget) * 100 : 0;
  return `- ${d.name}: Budget $${d.budget.toLocaleString()} | Actual $${d.actual.toLocaleString()} | Forecast $${d.forecast.toLocaleString()}
  Variance: $${variance.toLocaleString()} (${variance_pct.toFixed(1)}%)`;
}).join('\n\n')}

KPI Performance:
${Object.entries(context.kpis).map(([kpi, data]) => {
  const achievement = data.target !== 0 ? (data.actual / data.target) * 100 : 0;
  return `- ${kpi}: Target ${data.target}${data.unit} | Actual ${data.actual}${data.unit} | Achievement ${achievement.toFixed(1)}%`;
}).join('\n')}

Provide:
1. Overall budget performance summary
2. Department-level performance analysis
3. KPI achievement assessment
4. Trend analysis and patterns
5. Early warning indicators
6. Recommendations for course correction`;

    const result = await this.executeTask(task, {
      entity_type: 'performance_monitoring',
      entity_id: context.period,
    });
    
    return result.response;
  }
  
  /**
   * Conduct scenario planning
   */
  async conductScenarioPlanning(context: {
    base_case: Record<string, number>;
    variables: Array<{
      name: string;
      base_value: number;
      best_case_change: number;
      worst_case_change: number;
      unit: string;
    }>;
    planning_horizon: string;
  }): Promise<string> {
    const task = `Conduct scenario planning for ${context.planning_horizon}.

Base Case Assumptions:
${Object.entries(context.base_case).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Key Variables:
${context.variables.map(v => 
  `- ${v.name}: Base ${v.base_value}${v.unit} | Best Case ${v.best_case_change > 0 ? '+' : ''}${v.best_case_change}% | Worst Case ${v.worst_case_change}%`
).join('\n')}

Provide:
1. Best case scenario analysis and financial impact
2. Base case (most likely) scenario
3. Worst case scenario and mitigation strategies
4. Probability assessment for each scenario
5. Key decision points and trigger events
6. Contingency planning recommendations
7. Strategic implications for each scenario`;

    const result = await this.executeTask(task, {
      entity_type: 'scenario_planning',
    });
    
    return result.response;
  }
}
