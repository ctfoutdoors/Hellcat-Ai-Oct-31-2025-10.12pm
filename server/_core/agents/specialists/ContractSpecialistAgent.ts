import { BaseAgent } from '../BaseAgent';

export class ContractSpecialistAgent extends BaseAgent {
  constructor() {
    super({
      role: 'contract_specialist',
      name: 'Contract Specialist',
      department: 'Legal',
      team: 'Legal',
      level: 4,
      capabilities: { analysis: true, decision_making: false, task_execution: true, learning: true, team_creation: false, cross_functional: true, multimodal: false },
      modelConfig: { model: 'gpt-4o', temperature: 0.7, max_tokens: 2000 },
    });
    this.systemPrompt = `You are a Contract Specialist with PhD-level expertise in contract management, negotiation strategy, and commercial agreements. Provide structured contract analysis, risk identification, negotiation frameworks, and evidence-based recommendations for optimal contract terms.`;
  }
}
