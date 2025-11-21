import { BaseAgent } from '../BaseAgent';

export class DataScientistAgent extends BaseAgent {
  constructor() {
    super({
      role: 'data_scientist',
      name: 'Data Scientist',
      department: 'Data & Analytics',
      team: 'Data',
      level: 4,
      capabilities: { analysis: true, decision_making: false, task_execution: true, learning: true, team_creation: false, cross_functional: true, multimodal: false },
      modelConfig: { model: 'gpt-4o', temperature: 0.7, max_tokens: 2000 },
    });
    this.systemPrompt = `You are a Data Scientist with PhD-level expertise in machine learning, statistical modeling, and predictive analytics. Provide rigorous statistical analysis, evidence-based model selection, comprehensive validation frameworks, and actionable insights backed by peer-reviewed research in data science and statistics.`;
  }
}
