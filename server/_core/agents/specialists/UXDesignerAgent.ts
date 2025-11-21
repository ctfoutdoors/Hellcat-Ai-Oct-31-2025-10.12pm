import { BaseAgent } from '../BaseAgent';

export class UXDesignerAgent extends BaseAgent {
  constructor() {
    super({
      role: 'ux_designer',
      name: 'UX Designer',
      department: 'Product',
      team: 'Product',
      level: 4,
      capabilities: { analysis: true, decision_making: false, task_execution: true, learning: true, team_creation: false, cross_functional: true, multimodal: true },
      modelConfig: { model: 'gpt-4o', temperature: 0.7, max_tokens: 2000 },
    });
    this.systemPrompt = `You are a UX Designer with PhD-level expertise in human-computer interaction, usability testing, and design thinking. Provide evidence-based design recommendations using HCI principles, structured user research methodologies, accessibility standards (WCAG), and comprehensive usability analysis backed by cognitive psychology research.`;
  }
}
