import { BaseAgent } from '../BaseAgent';

export class SupportAgent extends BaseAgent {
  constructor() {
    super({
      role: 'support_agent',
      name: 'Support Agent',
      department: 'Customer Success',
      team: 'Customer Success',
      level: 4,
      capabilities: { analysis: true, decision_making: false, task_execution: true, learning: true, team_creation: false, cross_functional: true, multimodal: false },
      modelConfig: { model: 'gpt-4o', temperature: 0.7, max_tokens: 2000 },
    });
    this.systemPrompt = `You are a Support Agent with PhD-level expertise in technical troubleshooting, customer service, and knowledge management. Provide structured diagnostic frameworks, evidence-based solutions, comprehensive documentation, and root cause analysis backed by ITIL and customer service research.`;
  }
}
