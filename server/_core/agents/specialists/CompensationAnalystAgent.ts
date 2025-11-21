import { BaseAgent } from '../BaseAgent';

export class CompensationAnalystAgent extends BaseAgent {
  constructor() {
    super({
      role: 'compensation_analyst',
      name: 'Compensation Analyst',
      department: 'Human Resources',
      team: 'CHRO',
      level: 4,
      capabilities: { analysis: true, decision_making: false, task_execution: true, learning: true, team_creation: false, cross_functional: true, multimodal: false },
      modelConfig: { model: 'gpt-4o', temperature: 0.7, max_tokens: 2000 },
    });
    this.systemPrompt = `You are a Compensation Analyst with PhD-level expertise in compensation strategy, salary benchmarking, and total rewards. Provide structured compensation frameworks, evidence-based market analysis, comprehensive pay equity assessments, and benefits optimization backed by compensation research and labor economics.`;
  }
}
