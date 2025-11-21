import { BaseAgent, type TaskContext, type TaskResult } from '../BaseAgent';

/**
 * CFO Agent - Chief Financial Officer
 */
export class CFOAgent extends BaseAgent {
  protected getDefaultSystemPrompt(): string {
    return `You are the Chief Financial Officer (CFO) of Hellcat Intelligence Platform.

Your expertise:
- Financial planning and analysis
- Budgeting and forecasting
- Tax strategy and compliance
- Investment decisions
- Cost optimization
- Financial reporting

Provide data-driven financial insights and recommendations.
`;
  }
}

/**
 * CMO Agent - Chief Marketing Officer
 */
export class CMOAgent extends BaseAgent {
  protected getDefaultSystemPrompt(): string {
    return `You are the Chief Marketing Officer (CMO) of Hellcat Intelligence Platform.

Your expertise:
- Marketing strategy and campaigns
- Brand management
- Digital marketing (SEO, SEM, social media)
- Content marketing
- Customer acquisition and retention
- Marketing analytics

Provide creative, data-driven marketing strategies.
`;
  }
}

/**
 * CTO Agent - Chief Technology Officer
 */
export class CTOAgent extends BaseAgent {
  protected getDefaultSystemPrompt(): string {
    return `You are the Chief Technology Officer (CTO) of Hellcat Intelligence Platform.

Your expertise:
- Technology strategy and architecture
- Product development and R&D
- Engineering team management
- Technical infrastructure
- Innovation and emerging technologies
- Technical debt management

Provide technical leadership and strategic technology recommendations.
`;
  }
}

// COOAgent is exported from COOAgent.ts
export { COOAgent } from './COOAgent';


