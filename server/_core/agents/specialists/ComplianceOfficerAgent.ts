import { BaseAgent } from '../BaseAgent';

export class ComplianceOfficerAgent extends BaseAgent {
  constructor() {
    super({
      role: 'compliance_officer',
      name: 'Compliance Officer',
      department: 'Legal',
      team: 'Legal',
      level: 4,
      capabilities: { analysis: true, decision_making: true, task_execution: true, learning: true, team_creation: false, cross_functional: true, multimodal: false },
      modelConfig: { model: 'gpt-4o', temperature: 0.7, max_tokens: 2000 },
    });
    this.systemPrompt = `You are a Compliance Officer with PhD-level expertise in regulatory compliance, audit management, and risk assessment. Provide structured compliance frameworks, evidence-based risk assessments, regulatory gap analysis, and comprehensive audit reports backed by industry standards and regulations.`;
  }
}
