import { BaseAgent, type TaskContext, type TaskResult } from './BaseAgent';

/**
 * Master AI Agent (CEO)
 * Orchestrates all other agents, creates teams, delegates tasks
 */
export class MasterAgent extends BaseAgent {
  protected getDefaultSystemPrompt(): string {
    return `You are the Master AI Agent (CEO) of Hellcat Intelligence Platform.

Your responsibilities:
- Strategic oversight of all business operations
- Creating and managing specialized agent teams
- Delegating tasks to C-Suite executives
- Making high-level business decisions
- Coordinating cross-functional initiatives
- Learning from outcomes to improve the organization

You have full access to all company data and can command any agent in the system.
You can create unlimited teams of specialized agents as needed.

When given a command:
1. Analyze the request and determine which agents/teams are needed
2. Break down complex tasks into delegatable subtasks
3. Assign tasks to the appropriate C-Suite executives or specialist teams
4. Monitor progress and coordinate handoffs
5. Synthesize results and provide strategic recommendations

Always think strategically and leverage your team of 120+ specialized agents.
`;
  }
  
  /**
   * Process user command and orchestrate agent teams
   */
  async processCommand(
    command: string,
    context?: TaskContext
  ): Promise<TaskResult> {
    const taskDescription = `
User Command: ${command}

Analyze this command and provide:
1. **Intent Analysis**: What is the user trying to accomplish?
2. **Required Agents**: Which C-Suite executives or teams should handle this?
3. **Task Breakdown**: Break this into specific delegatable tasks
4. **Execution Plan**: Step-by-step plan to accomplish this
5. **Expected Outcome**: What success looks like

Format your response as a structured plan.
    `.trim();
    
    return this.executeTask(taskDescription, context);
  }
  
  /**
   * Create a specialized team for an initiative
   */
  async createTeam(
    purpose: string,
    requiredRoles: string[],
    context?: TaskContext
  ): Promise<TaskResult> {
    const taskDescription = `
Create a specialized team for: ${purpose}

Required roles: ${requiredRoles.join(', ')}

Provide:
1. **Team Structure**: Who should lead and who should be members
2. **Responsibilities**: What each role will do
3. **Success Metrics**: How to measure team performance
4. **Timeline**: Estimated duration and milestones
    `.trim();
    
    return this.executeTask(taskDescription, context);
  }
  
  /**
   * Analyze business situation and provide strategic recommendations
   */
  async analyzeBusinessSituation(
    situation: string,
    data?: any,
    context?: TaskContext
  ): Promise<TaskResult> {
    const taskDescription = `
Business Situation: ${situation}

${data ? `Data:\n${JSON.stringify(data, null, 2)}` : ''}

Provide strategic analysis:
1. **Situation Assessment**: Current state and key factors
2. **Opportunities**: What can be leveraged
3. **Risks**: What needs to be mitigated
4. **Strategic Recommendations**: Top 3-5 actionable recommendations
5. **Required Resources**: Which agents/teams should be involved
    `.trim();
    
    return this.executeTask(taskDescription, context);
  }
}
