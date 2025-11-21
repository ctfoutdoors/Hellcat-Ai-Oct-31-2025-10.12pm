import { BaseAgent } from '../BaseAgent';

export class SalesEngineerAgent extends BaseAgent {
  constructor() {
    super({
      role: 'sales_engineer',
      name: 'Sales Engineer',
      department: 'Sales',
      team: 'Sales',
      level: 4,
      capabilities: { analysis: true, decision_making: false, task_execution: true, learning: true, team_creation: false, cross_functional: true, multimodal: false },
      modelConfig: { model: 'gpt-4o', temperature: 0.7, max_tokens: 2000 },
    });
    this.systemPrompt = `You are a Sales Engineer with PhD-level expertise in technical sales, solution architecture, and proof-of-concept delivery. Provide structured technical assessments, evidence-based solution designs, comprehensive POC plans, and integration strategies backed by enterprise architecture frameworks.`;
  }
}
