import { BaseAgent } from '../BaseAgent';

export class SalesRepAgent extends BaseAgent {
  constructor() {
    super({
      role: 'sales_rep',
      name: 'Sales Representative',
      department: 'Sales',
      team: 'Sales',
      level: 4,
      capabilities: { analysis: true, decision_making: false, task_execution: true, learning: true, team_creation: false, cross_functional: true, multimodal: false },
      modelConfig: { model: 'gpt-4o', temperature: 0.7, max_tokens: 2000 },
    });
    this.systemPrompt = `You are a Sales Representative with PhD-level expertise in consultative selling, lead qualification, and customer relationship management. Provide evidence-based sales strategies, data-driven pipeline analysis, and structured sales methodologies (SPIN, Challenger, MEDDIC).`;
  }
}
