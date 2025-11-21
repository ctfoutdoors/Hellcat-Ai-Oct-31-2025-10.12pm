import { BaseAgent } from '../BaseAgent';
import type { AIAgent } from '../../../../drizzle/schema';

/**
 * COO Agent - Chief Operating Officer
 * 
 * Responsibilities:
 * - Operations management and optimization
 * - Specialist team coordination
 * - Task execution oversight
 * - Process improvement
 * - Resource allocation
 * - Performance monitoring
 */
export class COOAgent extends BaseAgent {
  constructor(agentData: AIAgent) {
    super(agentData);
  }
  
  /**
   * Get default system prompt for COO
   */
  protected getDefaultSystemPrompt(): string {
    return `You are the Chief Operating Officer (COO) of an enterprise AI organization.

Your primary responsibilities:
1. **Operations Management**: Oversee day-to-day operations across all departments
2. **Team Coordination**: Manage specialist agent teams and ensure efficient collaboration
3. **Task Execution**: Monitor and optimize task completion across the organization
4. **Process Improvement**: Identify bottlenecks and implement operational improvements
5. **Resource Allocation**: Distribute workload efficiently among specialist agents
6. **Performance Monitoring**: Track KPIs and operational metrics

Your expertise includes:
- Operations strategy and planning
- Team management and coordination
- Process optimization
- Resource management
- Performance analytics
- Risk management

When analyzing operations:
- Focus on efficiency and productivity
- Identify process bottlenecks
- Recommend resource optimizations
- Provide actionable improvement plans
- Monitor team performance metrics

Always provide data-driven insights with clear action items.`;
  }
  
  /**
   * Analyze operational efficiency
   */
  async analyzeOperations(data: {
    teams?: any[];
    tasks?: any[];
    resources?: any[];
    timeframe?: string;
  }): Promise<any> {
    const taskDescription = `
Analyze the current operational state:

Teams: ${data.teams?.length || 0} active teams
Tasks: ${data.tasks?.length || 0} total tasks
Resources: ${data.resources?.length || 0} resources allocated
Timeframe: ${data.timeframe || 'Current period'}

Provide:
1. Operational efficiency score (0-100)
2. Key bottlenecks identified
3. Resource utilization analysis
4. Team performance summary
5. Recommended improvements
6. Priority action items
    `.trim();
    
    return this.executeTask(taskDescription, {
      entity_type: 'operations_analysis',
      data,
    });
  }
  
  /**
   * Optimize task distribution
   */
  async optimizeTaskDistribution(tasks: any[], agents: any[]): Promise<any> {
    const taskDescription = `
Optimize task distribution across available agents:

Total tasks: ${tasks.length}
Available agents: ${agents.length}

Tasks breakdown:
${tasks.map((t, i) => `${i + 1}. ${t.title} (Priority: ${t.priority}, Status: ${t.status})`).join('\n')}

Agents:
${agents.map((a, i) => `${i + 1}. ${a.name} (Role: ${a.role}, Current load: ${a.currentTasks || 0} tasks)`).join('\n')}

Provide:
1. Optimal task assignment plan
2. Load balancing recommendations
3. Priority queue ordering
4. Estimated completion timeline
5. Risk factors and mitigation
    `.trim();
    
    return this.executeTask(taskDescription, {
      entity_type: 'task_optimization',
      tasks,
      agents,
    });
  }
  
  /**
   * Monitor team performance
   */
  async monitorTeamPerformance(teamData: {
    teamName: string;
    members: any[];
    completedTasks: number;
    pendingTasks: number;
    avgCompletionTime: number;
  }): Promise<any> {
    const taskDescription = `
Monitor performance for team: ${teamData.teamName}

Team metrics:
- Members: ${teamData.members.length}
- Completed tasks: ${teamData.completedTasks}
- Pending tasks: ${teamData.pendingTasks}
- Average completion time: ${teamData.avgCompletionTime} hours

Team composition:
${teamData.members.map((m, i) => `${i + 1}. ${m.name} (${m.role})`).join('\n')}

Provide:
1. Team performance score (0-100)
2. Individual member assessment
3. Productivity trends
4. Areas for improvement
5. Training recommendations
6. Resource needs
    `.trim();
    
    return this.executeTask(taskDescription, {
      entity_type: 'team_performance',
      team: teamData,
    });
  }
  
  /**
   * Create operational improvement plan
   */
  async createImprovementPlan(issues: string[], goals: string[]): Promise<any> {
    const taskDescription = `
Create an operational improvement plan:

Current issues:
${issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

Goals:
${goals.map((goal, i) => `${i + 1}. ${goal}`).join('\n')}

Provide:
1. Prioritized improvement initiatives
2. Implementation timeline (phases)
3. Resource requirements
4. Success metrics
5. Risk assessment
6. Quick wins (immediate actions)
    `.trim();
    
    return this.executeTask(taskDescription, {
      entity_type: 'improvement_plan',
      issues,
      goals,
    });
  }
}
