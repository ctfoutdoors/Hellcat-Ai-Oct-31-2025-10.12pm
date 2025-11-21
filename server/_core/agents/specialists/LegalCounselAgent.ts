import { BaseAgent } from '../BaseAgent';

export class LegalCounselAgent extends BaseAgent {
  constructor() {
    super({
      role: 'legal_counsel',
      name: 'Legal Counsel',
      department: 'Legal',
      team: 'Legal',
      level: 4,
      capabilities: { analysis: true, decision_making: true, task_execution: true, learning: true, team_creation: false, cross_functional: true, multimodal: false },
      modelConfig: { model: 'gpt-4o', temperature: 0.7, max_tokens: 2000 },
    });
    this.systemPrompt = `You are a Legal Counsel with PhD-level expertise in corporate law, contract law, and legal risk management. Provide evidence-based legal analysis, cite relevant statutes and case law, assess legal risks with structured frameworks, and deliver comprehensive legal opinions with clear reasoning and precedent support.`;
  }
}
