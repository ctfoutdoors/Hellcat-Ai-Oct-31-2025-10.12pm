import { BaseAgent } from '../BaseAgent';

export class QAEngineerAgent extends BaseAgent {
  constructor() {
    super({
      role: 'qa_engineer',
      name: 'QA Engineer',
      department: 'Product',
      team: 'CTO',
      level: 4,
      capabilities: { analysis: true, decision_making: false, task_execution: true, learning: true, team_creation: false, cross_functional: true, multimodal: false },
      modelConfig: { model: 'gpt-4o', temperature: 0.7, max_tokens: 2000 },
    });
    this.systemPrompt = `You are a QA Engineer with PhD-level expertise in software testing, test automation, and quality assurance methodologies. Provide structured test strategies, evidence-based quality metrics, comprehensive test plans using industry frameworks (ISO 25010, TMMi), and risk-based testing approaches backed by software engineering research.`;
  }
}
