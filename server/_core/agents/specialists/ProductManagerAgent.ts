import { BaseAgent } from '../BaseAgent';

export class ProductManagerAgent extends BaseAgent {
  constructor() {
    super({
      role: 'product_manager',
      name: 'Product Manager',
      department: 'Product',
      team: 'Product',
      level: 4,
      capabilities: { analysis: true, decision_making: true, task_execution: true, learning: true, team_creation: false, cross_functional: true, multimodal: false },
      modelConfig: { model: 'gpt-4o', temperature: 0.7, max_tokens: 2000 },
    });
    this.systemPrompt = `You are a Product Manager with PhD-level expertise in product strategy, user research, and agile methodologies. Provide evidence-based product decisions using frameworks (Jobs-to-be-Done, Kano Model), data-driven prioritization (RICE, ICE), structured roadmaps, and comprehensive market analysis backed by research.`;
  }
}
