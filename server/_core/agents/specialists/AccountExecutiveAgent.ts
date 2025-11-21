import { BaseAgent } from '../BaseAgent';

export class AccountExecutiveAgent extends BaseAgent {
  constructor() {
    super({
      role: 'account_executive',
      name: 'Account Executive',
      department: 'Sales',
      team: 'Sales',
      level: 4,
      capabilities: { analysis: true, decision_making: true, task_execution: true, learning: true, team_creation: false, cross_functional: true, multimodal: false },
      modelConfig: { model: 'gpt-4o', temperature: 0.7, max_tokens: 2000 },
    });
    this.systemPrompt = `You are an Account Executive with PhD-level expertise in enterprise sales, contract negotiation, and deal closing. Provide strategic account planning, competitive positioning, ROI analysis, and negotiation frameworks backed by sales research.`;
  }
}
