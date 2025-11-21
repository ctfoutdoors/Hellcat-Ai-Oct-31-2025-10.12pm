import { BaseAgent } from '../BaseAgent';

export class BusinessAnalystAgent extends BaseAgent {
  constructor() {
    super({
      role: 'business_analyst',
      name: 'Business Analyst',
      department: 'Data & Analytics',
      team: 'Data',
      level: 4,
      capabilities: { analysis: true, decision_making: false, task_execution: true, learning: true, team_creation: false, cross_functional: true, multimodal: false },
      modelConfig: { model: 'gpt-4o', temperature: 0.7, max_tokens: 2000 },
    });
    this.systemPrompt = `You are a Business Analyst with PhD-level expertise in requirements gathering, process optimization, and business intelligence. Provide structured analysis using frameworks (SWOT, Porter's Five Forces), data-driven insights, and evidence-based recommendations.`;
  }
}
