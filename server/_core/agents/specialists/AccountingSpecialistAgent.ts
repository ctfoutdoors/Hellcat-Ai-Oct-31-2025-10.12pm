import { BaseAgent } from '../BaseAgent';
import type { AIAgent } from '../../../../drizzle/schema';

/**
 * Accounting Specialist Agent
 * 
 * Reports to: CFO
 * Department: Finance
 * 
 * Expertise:
 * - Financial accounting and reporting
 * - Bookkeeping and reconciliation
 * - GAAP/IFRS compliance
 * - Month-end and year-end close
 * - Financial statement preparation
 * - Account analysis and variance explanation
 */
export class AccountingSpecialistAgent extends BaseAgent {
  constructor(agentData: AIAgent) {
    super(agentData);
  }
  
  /**
   * Get specialized system prompt for Accounting Specialist
   */
  protected getSpecializedPrompt(): string {
    return `You are an Accounting Specialist with PhD-level expertise in financial accounting, reporting standards, and accounting systems.

**CORE COMPETENCIES:**

1. **Financial Accounting**
   - Double-entry bookkeeping principles
   - Accrual vs. cash basis accounting
   - Revenue recognition (ASC 606 / IFRS 15)
   - Expense matching and allocation
   - Asset capitalization and depreciation
   - Liability recognition and measurement

2. **Financial Reporting**
   - Balance sheet preparation and analysis
   - Income statement construction
   - Cash flow statement (direct and indirect methods)
   - Statement of changes in equity
   - Notes to financial statements
   - Management discussion and analysis (MD&A)

3. **Reconciliation & Controls**
   - Bank reconciliation procedures
   - Intercompany reconciliation
   - Account reconciliation best practices
   - Internal control design and testing
   - Segregation of duties frameworks
   - Audit trail maintenance

4. **Period-End Close**
   - Month-end close procedures and checklists
   - Quarter-end reporting requirements
   - Year-end close and audit preparation
   - Adjusting journal entries
   - Accruals and deferrals
   - Cut-off procedures

5. **Accounting Standards**
   - US GAAP compliance and application
   - IFRS standards and convergence
   - Industry-specific accounting guidance
   - Recent standard updates (ASUs)
   - Disclosure requirements
   - Fair value measurement (ASC 820)

**ANALYTICAL FRAMEWORKS:**

- **Variance Analysis**: Compare actual vs. budget/forecast with root cause analysis
- **Ratio Analysis**: Liquidity, profitability, efficiency, and leverage ratios
- **Trend Analysis**: Multi-period financial metric trends and patterns
- **Common-Size Analysis**: Vertical and horizontal financial statement analysis
- **Working Capital Analysis**: Current assets, liabilities, and cash conversion cycle

**DELIVERABLES:**

- Accurate financial statements with supporting schedules
- Account reconciliation reports with variance explanations
- Journal entry documentation with business rationale
- Month-end close checklists and status reports
- Accounting policy memos and implementation guidance
- Audit support documentation and PBC (Provided By Client) lists

**COMMUNICATION STANDARDS:**

- Cite specific accounting standards (ASC/IFRS codification)
- Provide clear audit trails and supporting documentation
- Explain complex transactions in plain language
- Quantify financial impacts and materiality
- Flag accounting issues requiring management judgment
- Recommend process improvements and automation opportunities

Always ensure accuracy, completeness, and compliance with applicable accounting standards while maintaining clear documentation for audit and review purposes.`;
  }
  
  /**
   * Perform account reconciliation analysis
   */
  async performReconciliation(context: {
    account_name: string;
    book_balance: number;
    bank_balance?: number;
    period: string;
    transactions: Array<{
      date: string;
      description: string;
      amount: number;
    }>;
  }): Promise<string> {
    const task = `Perform account reconciliation for ${context.account_name}.

Period: ${context.period}
Book Balance: $${context.book_balance.toLocaleString()}
${context.bank_balance ? `Bank Balance: $${context.bank_balance.toLocaleString()}` : ''}

Transactions (${context.transactions.length} items):
${context.transactions.slice(0, 10).map(t => `- ${t.date}: ${t.description} - $${t.amount.toLocaleString()}`).join('\n')}
${context.transactions.length > 10 ? `... and ${context.transactions.length - 10} more` : ''}

Provide:
1. Reconciliation analysis and variance explanation
2. Outstanding items identification
3. Timing differences vs. errors
4. Required adjusting entries
5. Control weaknesses identified
6. Recommendations for process improvement`;

    const result = await this.executeTask(task, {
      entity_type: 'account_reconciliation',
      entity_id: context.period,
    });
    
    return result.response;
  }
  
  /**
   * Prepare financial statements
   */
  async prepareFinancialStatements(context: {
    period: string;
    trial_balance: Record<string, number>;
    adjustments?: Array<{
      description: string;
      debit_account: string;
      credit_account: string;
      amount: number;
    }>;
  }): Promise<string> {
    const task = `Prepare financial statements for period ${context.period}.

Trial Balance Summary:
${Object.entries(context.trial_balance).slice(0, 15).map(([account, balance]) => 
  `- ${account}: $${balance.toLocaleString()}`
).join('\n')}

${context.adjustments ? `Adjusting Entries: ${context.adjustments.length} entries` : ''}

Provide:
1. Balance Sheet (classified format)
2. Income Statement (multi-step format)
3. Cash Flow Statement (indirect method)
4. Key financial ratios and metrics
5. Variance analysis vs. prior period
6. Notes on significant items and accounting policies`;

    const result = await this.executeTask(task, {
      entity_type: 'financial_statements',
      entity_id: context.period,
    });
    
    return result.response;
  }
  
  /**
   * Analyze month-end close status
   */
  async analyzeMonthEndClose(context: {
    period: string;
    close_tasks: Array<{
      task: string;
      owner: string;
      status: 'completed' | 'in_progress' | 'not_started';
      due_date: string;
    }>;
    issues?: string[];
  }): Promise<string> {
    const task = `Analyze month-end close status for ${context.period}.

Close Tasks (${context.close_tasks.length} total):
${context.close_tasks.map(t => `- ${t.task} (${t.owner}): ${t.status} - Due: ${t.due_date}`).join('\n')}

${context.issues ? `Known Issues:\n${context.issues.map(i => `- ${i}`).join('\n')}` : ''}

Provide:
1. Close status summary and completion percentage
2. Critical path items and dependencies
3. At-risk tasks requiring escalation
4. Issue resolution recommendations
5. Process bottlenecks and efficiency opportunities
6. Timeline for close completion`;

    const result = await this.executeTask(task, {
      entity_type: 'month_end_close',
      entity_id: context.period,
    });
    
    return result.response;
  }
  
  /**
   * Review journal entries for accuracy and compliance
   */
  async reviewJournalEntries(context: {
    entries: Array<{
      entry_number: string;
      date: string;
      description: string;
      debits: Record<string, number>;
      credits: Record<string, number>;
      preparer: string;
    }>;
  }): Promise<string> {
    const task = `Review journal entries for accuracy and compliance.

Entries to Review (${context.entries.length} total):
${context.entries.map(e => {
  const totalDebits = Object.values(e.debits).reduce((sum, val) => sum + val, 0);
  const totalCredits = Object.values(e.credits).reduce((sum, val) => sum + val, 0);
  return `- ${e.entry_number} (${e.date}): ${e.description}
  Debits: $${totalDebits.toLocaleString()} | Credits: $${totalCredits.toLocaleString()}
  Preparer: ${e.preparer}`;
}).join('\n\n')}

Provide:
1. Entry-by-entry review with findings
2. Balancing verification (debits = credits)
3. Account classification accuracy
4. Supporting documentation adequacy
5. Compliance with accounting standards
6. Approval recommendations (approve/revise/reject)`;

    const result = await this.executeTask(task, {
      entity_type: 'journal_entry_review',
    });
    
    return result.response;
  }
  
  /**
   * Assess accounting policy application
   */
  async assessAccountingPolicy(context: {
    transaction_type: string;
    transaction_details: Record<string, any>;
    proposed_treatment: string;
  }): Promise<string> {
    const task = `Assess accounting policy application for transaction.

Transaction Type: ${context.transaction_type}
Details: ${JSON.stringify(context.transaction_details, null, 2)}
Proposed Treatment: ${context.proposed_treatment}

Provide:
1. Applicable accounting standards (ASC/IFRS references)
2. Technical analysis of proposed treatment
3. Alternative treatments and their implications
4. Disclosure requirements
5. Impact on financial statements
6. Recommendation with supporting rationale`;

    const result = await this.executeTask(task, {
      entity_type: 'accounting_policy',
    });
    
    return result.response;
  }
}
