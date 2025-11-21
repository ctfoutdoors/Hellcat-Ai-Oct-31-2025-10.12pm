import { invokeLLM } from '../llm';
import type { AIAgent, InsertAIAgent } from '../../../drizzle/schema';

export type AgentRole = AIAgent['role'];
export type AgentStatus = AIAgent['status'];

export interface AgentCapabilities {
  analysis?: boolean;
  decision_making?: boolean;
  task_execution?: boolean;
  learning?: boolean;
  team_creation?: boolean;
  cross_functional?: boolean;
  multimodal?: boolean;
}

export interface ModelConfig {
  model: string;
  temperature?: number;
  max_tokens?: number;
  system_prompt?: string;
  tools?: string[];
}

export interface TaskContext {
  entity_type?: string;
  entity_id?: number;
  related_tasks?: number[];
  dependencies?: number[];
  [key: string]: any;
}

export interface TaskResult {
  success: boolean;
  output?: any;
  error?: string;
  learnings?: string[];
  recommendations?: string[];
}

/**
 * Base Agent Class
 * Foundation for all AI agents in the enterprise system
 */
export class BaseAgent {
  protected agentData: AIAgent;
  
  constructor(agentData: AIAgent) {
    this.agentData = agentData;
  }
  
  // Getters
  get id(): number {
    return this.agentData.id;
  }
  
  get role(): AgentRole {
    return this.agentData.role;
  }
  
  get name(): string {
    return this.agentData.name;
  }
  
  get department(): string | null {
    return this.agentData.department;
  }
  
  get team(): string | null {
    return this.agentData.team;
  }
  
  get status(): AgentStatus {
    return this.agentData.status;
  }
  
  get capabilities(): AgentCapabilities {
    return this.agentData.capabilities as AgentCapabilities;
  }
  
  get modelConfig(): ModelConfig {
    return this.agentData.modelConfig as ModelConfig;
  }
  
  get accessLevel(): number {
    return this.agentData.accessLevel;
  }
  
  /**
   * Execute a task using GPT-4o
   */
  async executeTask(
    taskDescription: string,
    context?: TaskContext,
    options?: {
      temperature?: number;
      max_tokens?: number;
    }
  ): Promise<TaskResult> {
    try {
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(taskDescription, context);
      
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      });
      
      const output = response.choices[0].message.content;
      
      return {
        success: true,
        output,
        learnings: this.extractLearnings(output),
        recommendations: this.extractRecommendations(output),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
  
  /**
   * Analyze data using GPT-4o
   */
  async analyze(
    data: any,
    analysisType: string,
    context?: TaskContext
  ): Promise<TaskResult> {
    if (!this.capabilities.analysis) {
      return {
        success: false,
        error: `Agent ${this.name} does not have analysis capability`,
      };
    }
    
    const taskDescription = `Perform ${analysisType} analysis on the following data:\n\n${JSON.stringify(data, null, 2)}`;
    return this.executeTask(taskDescription, context);
  }
  
  /**
   * Make a decision using GPT-4o
   */
  async makeDecision(
    situation: string,
    options: string[],
    context?: TaskContext
  ): Promise<TaskResult> {
    if (!this.capabilities.decision_making) {
      return {
        success: false,
        error: `Agent ${this.name} does not have decision-making capability`,
      };
    }
    
    const taskDescription = `
Situation: ${situation}

Available options:
${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}

Analyze the situation and recommend the best option with detailed reasoning.
    `.trim();
    
    return this.executeTask(taskDescription, context);
  }
  
  /**
   * Learn from feedback and outcomes
   */
  async learn(
    outcome: any,
    feedback: string,
    context?: TaskContext
  ): Promise<TaskResult> {
    if (!this.capabilities.learning) {
      return {
        success: false,
        error: `Agent ${this.name} does not have learning capability`,
      };
    }
    
    const taskDescription = `
Analyze the following outcome and feedback to extract learnings:

Outcome: ${JSON.stringify(outcome, null, 2)}
Feedback: ${feedback}

Extract:
1. What worked well
2. What didn't work
3. Key learnings
4. Recommendations for future similar situations
    `.trim();
    
    return this.executeTask(taskDescription, context);
  }
  
  /**
   * Delegate task to subordinate agent
   */
  async delegateTask(
    taskDescription: string,
    subordinateAgentId: number,
    priority: 'urgent' | 'high' | 'normal' | 'low' = 'normal',
    context?: TaskContext
  ): Promise<{ taskId: number }> {
    // This will be implemented when we build the task delegation system
    throw new Error('Task delegation not yet implemented');
  }
  
  /**
   * Collaborate with other agents
   */
  async collaborate(
    agentIds: number[],
    objective: string,
    context?: TaskContext
  ): Promise<TaskResult> {
    if (!this.capabilities.cross_functional) {
      return {
        success: false,
        error: `Agent ${this.name} does not have cross-functional collaboration capability`,
      };
    }
    
    // This will be implemented when we build the agent communication system
    throw new Error('Agent collaboration not yet implemented');
  }
  
  /**
   * Build system prompt based on agent role and capabilities
   */
  protected buildSystemPrompt(): string {
    const basePrompt = this.modelConfig.system_prompt || this.getDefaultSystemPrompt();
    
    const capabilitiesDesc = Object.entries(this.capabilities)
      .filter(([_, enabled]) => enabled)
      .map(([cap]) => cap.replace(/_/g, ' '))
      .join(', ');
    
    return `${basePrompt}

Your role: ${this.role.replace(/_/g, ' ').toUpperCase()}
Your name: ${this.name}
Department: ${this.department || 'N/A'}
Team: ${this.team || 'N/A'}
Capabilities: ${capabilitiesDesc}

Always provide detailed, actionable insights based on your expertise and role.
`;
  }
  
  /**
   * Get default system prompt for this agent type
   */
  protected getDefaultSystemPrompt(): string {
    return `You are an AI agent in an enterprise system. Your role is to provide expert analysis, decisions, and recommendations within your area of expertise.`;
  }
  
  /**
   * Build user prompt with task and context
   */
  protected buildUserPrompt(taskDescription: string, context?: TaskContext): string {
    let prompt = taskDescription;
    
    if (context) {
      prompt += `\n\nContext:\n${JSON.stringify(context, null, 2)}`;
    }
    
    return prompt;
  }
  
  /**
   * Extract learnings from agent output
   */
  protected extractLearnings(output: string): string[] {
    // Simple extraction - can be enhanced with structured output
    const learnings: string[] = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.toLowerCase().includes('learning:') || line.toLowerCase().includes('learned:')) {
        learnings.push(line.trim());
      }
    }
    
    return learnings;
  }
  
  /**
   * Extract recommendations from agent output
   */
  protected extractRecommendations(output: string): string[] {
    const recommendations: string[] = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.toLowerCase().includes('recommend') || line.toLowerCase().includes('suggestion:')) {
        recommendations.push(line.trim());
      }
    }
    
    return recommendations;
  }
}
