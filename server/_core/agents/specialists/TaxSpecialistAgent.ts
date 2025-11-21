import { BaseAgent } from '../BaseAgent';
import type { AIAgent } from '../../../../drizzle/schema';

/**
 * Tax Specialist Agent
 * 
 * Reports to: CFO
 * Department: Finance
 * 
 * Expertise:
 * - Tax planning and strategy
 * - Tax compliance and filing
 * - Tax optimization and credits
 * - International tax regulations
 * - Tax risk assessment
 * - Audit support and documentation
 */
export class TaxSpecialistAgent extends BaseAgent {
  constructor(agentData: AIAgent) {
    super(agentData);
  }
  
  /**
   * Get specialized system prompt for Tax Specialist
   */
  protected getSpecializedPrompt(): string {
    return `You are a Tax Specialist with PhD-level expertise in taxation, tax law, and tax strategy.

**CORE COMPETENCIES:**

1. **Tax Planning & Strategy**
   - Multi-year tax planning frameworks
   - Entity structure optimization
   - Timing strategies for income and deductions
   - Tax-efficient investment structures
   - Succession and estate planning
   - International tax planning

2. **Tax Compliance**
   - Federal, state, and local tax regulations
   - Filing requirements and deadlines
   - Documentation and record-keeping standards
   - Regulatory compliance verification
   - Audit trail maintenance

3. **Tax Optimization**
   - Tax credit identification and utilization
   - Deduction maximization strategies
   - Loss harvesting and carryforward planning
   - R&D tax credits and incentives
   - Depreciation and amortization optimization
   - Transfer pricing strategies

4. **Risk Management**
   - Tax risk assessment and quantification
   - Uncertain tax position (UTP) analysis
   - Audit probability evaluation
   - Penalty and interest exposure analysis
   - Tax controversy management

5. **International Taxation**
   - Cross-border transaction structuring
   - Transfer pricing compliance
   - Foreign tax credit optimization
   - BEPS (Base Erosion and Profit Shifting) compliance
   - Withholding tax management
   - Tax treaty analysis

**ANALYTICAL FRAMEWORKS:**

- **Effective Tax Rate (ETR) Analysis**: Calculate and analyze ETR across periods, jurisdictions, and scenarios
- **Tax Provision Analysis**: ASC 740 / IAS 12 compliance and optimization
- **Cash Tax vs. Book Tax**: Reconciliation and timing difference analysis
- **Tax Attribute Tracking**: NOL, credit carryforwards, and utilization planning
- **Scenario Modeling**: Multi-scenario tax impact analysis for strategic decisions

**DELIVERABLES:**

- Tax planning memos with specific recommendations
- Compliance checklists and filing calendars
- Tax savings opportunity assessments
- Risk assessment reports with mitigation strategies
- Tax position documentation for audits
- International tax structure recommendations

**COMMUNICATION STANDARDS:**

- Cite specific tax code sections (IRC, state codes)
- Reference relevant case law and IRS guidance
- Provide confidence levels for tax positions
- Quantify tax savings and risk exposure
- Include implementation timelines and dependencies
- Flag time-sensitive opportunities and deadlines

Always provide actionable tax strategies grounded in current tax law, with clear risk-reward analysis and implementation guidance.`;
  }
  
  /**
   * Analyze tax planning opportunities
   */
  async analyzeTaxPlanning(context: {
    fiscal_year: number;
    revenue: number;
    expenses: number;
    entity_type: string;
    jurisdiction: string;
  }): Promise<string> {
    const task = `Analyze tax planning opportunities for fiscal year ${context.fiscal_year}.

Entity Type: ${context.entity_type}
Jurisdiction: ${context.jurisdiction}
Revenue: $${context.revenue.toLocaleString()}
Expenses: $${context.expenses.toLocaleString()}

Provide:
1. Current tax position analysis
2. Tax optimization opportunities
3. Timing strategies for income/deductions
4. Available credits and incentives
5. Risk assessment
6. Specific action items with deadlines`;

    const result = await this.executeTask(task, {
      entity_type: 'tax_planning',
      entity_id: context.fiscal_year,
    });
    
    return result.response;
  }
  
  /**
   * Assess tax compliance requirements
   */
  async assessCompliance(context: {
    entity_type: string;
    jurisdictions: string[];
    fiscal_year_end: string;
  }): Promise<string> {
    const task = `Assess tax compliance requirements.

Entity Type: ${context.entity_type}
Jurisdictions: ${context.jurisdictions.join(', ')}
Fiscal Year End: ${context.fiscal_year_end}

Provide:
1. Comprehensive filing requirements by jurisdiction
2. Filing deadlines and extensions
3. Required documentation and schedules
4. Estimated tax payment requirements
5. Compliance calendar for the year
6. Risk areas requiring attention`;

    const result = await this.executeTask(task, {
      entity_type: 'compliance_assessment',
    });
    
    return result.response;
  }
  
  /**
   * Evaluate tax credits and incentives
   */
  async evaluateTaxCredits(context: {
    business_activities: string[];
    expenditures: Record<string, number>;
    jurisdiction: string;
  }): Promise<string> {
    const task = `Evaluate available tax credits and incentives.

Business Activities: ${context.business_activities.join(', ')}
Jurisdiction: ${context.jurisdiction}
Expenditures: ${JSON.stringify(context.expenditures, null, 2)}

Provide:
1. Applicable tax credits by category
2. Eligibility requirements and documentation
3. Estimated credit amounts
4. Claiming procedures and deadlines
5. Carryforward and carryback provisions
6. Specific action plan to maximize credits`;

    const result = await this.executeTask(task, {
      entity_type: 'tax_credits',
    });
    
    return result.response;
  }
  
  /**
   * Assess tax risk and exposure
   */
  async assessTaxRisk(context: {
    tax_positions: Array<{
      position: string;
      amount: number;
      authority: string;
    }>;
    prior_audits?: string[];
  }): Promise<string> {
    const task = `Assess tax risk and exposure for current positions.

Tax Positions:
${context.tax_positions.map(p => `- ${p.position}: $${p.amount.toLocaleString()} (Authority: ${p.authority})`).join('\n')}

${context.prior_audits ? `Prior Audit History: ${context.prior_audits.join(', ')}` : ''}

Provide:
1. Risk assessment for each position (High/Medium/Low)
2. Probability of IRS challenge
3. Potential penalty and interest exposure
4. Uncertain tax position (UTP) analysis
5. Documentation requirements
6. Risk mitigation strategies`;

    const result = await this.executeTask(task, {
      entity_type: 'tax_risk',
    });
    
    return result.response;
  }
  
  /**
   * Analyze international tax implications
   */
  async analyzeInternationalTax(context: {
    countries: string[];
    transaction_types: string[];
    annual_volume: number;
  }): Promise<string> {
    const task = `Analyze international tax implications.

Countries: ${context.countries.join(', ')}
Transaction Types: ${context.transaction_types.join(', ')}
Annual Volume: $${context.annual_volume.toLocaleString()}

Provide:
1. Applicable tax treaties and benefits
2. Withholding tax requirements
3. Transfer pricing considerations
4. BEPS compliance requirements
5. Foreign tax credit opportunities
6. Optimal structure recommendations`;

    const result = await this.executeTask(task, {
      entity_type: 'international_tax',
    });
    
    return result.response;
  }
}
