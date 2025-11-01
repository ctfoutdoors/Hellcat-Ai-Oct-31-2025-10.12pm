import { getDb } from '../db';
import {
  workflows,
  workflowExecutions,
  workflowExecutionSteps,
  workflowNodeTypes,
  cases
} from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { generateDisputeLetter } from './documentService';
import { carrierPortalAutomation } from './CarrierPortalAutomation';

// Workflow node definition
interface WorkflowNode {
  id: string;
  type: string;
  data: any;
  position: { x: number; y: number };
}

// Workflow edge definition
interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  data?: any;
}

// Workflow execution context
interface WorkflowContext {
  caseId?: number;
  variables: Record<string, any>;
  [key: string]: any;
}

export class WorkflowEngineService {
  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowId: number, context: WorkflowContext): Promise<number> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Get workflow definition
    const workflowResult = await db
      .select()
      .from(workflows)
      .where(eq(workflows.id, workflowId))
      .limit(1);

    if (workflowResult.length === 0) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const workflow = workflowResult[0];

    if (!workflow.isActive) {
      throw new Error(`Workflow ${workflowId} is not active`);
    }

    // Parse workflow definition
    const nodes: WorkflowNode[] = JSON.parse(workflow.nodes);
    const edges: WorkflowEdge[] = JSON.parse(workflow.edges);

    // Create execution record
    const executionResult = await db.insert(workflowExecutions).values({
      workflowId,
      caseId: context.caseId,
      status: 'RUNNING',
      context: JSON.stringify(context),
      startedAt: new Date(),
      triggerSource: 'MANUAL',
    });

    const executionId = executionResult[0].insertId;

    try {
      // Find start node (node with no incoming edges)
      const startNode = this.findStartNode(nodes, edges);
      
      if (!startNode) {
        throw new Error('No start node found in workflow');
      }

      // Execute workflow from start node
      await this.executeNode(executionId, startNode, nodes, edges, context);

      // Mark execution as completed
      await db
        .update(workflowExecutions)
        .set({
          status: 'COMPLETED',
          completedAt: new Date(),
        })
        .where(eq(workflowExecutions.id, executionId));

      // Update workflow stats
      await db
        .update(workflows)
        .set({
          executionCount: workflow.executionCount + 1,
          successCount: workflow.successCount + 1,
        })
        .where(eq(workflows.id, workflowId));

      return executionId;

    } catch (error: any) {
      console.error('Workflow execution failed:', error);

      // Mark execution as failed
      await db
        .update(workflowExecutions)
        .set({
          status: 'FAILED',
          errorMessage: error.message,
          errorDetails: JSON.stringify({ stack: error.stack }),
          completedAt: new Date(),
        })
        .where(eq(workflowExecutions.id, executionId));

      // Update workflow stats
      await db
        .update(workflows)
        .set({
          executionCount: workflow.executionCount + 1,
          failureCount: workflow.failureCount + 1,
        })
        .where(eq(workflows.id, workflowId));

      throw error;
    }
  }

  /**
   * Find the start node (node with no incoming edges)
   */
  private findStartNode(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode | null {
    const nodesWithIncoming = new Set(edges.map(e => e.target));
    const startNode = nodes.find(n => !nodesWithIncoming.has(n.id));
    return startNode || null;
  }

  /**
   * Execute a single node and its descendants
   */
  private async executeNode(
    executionId: number,
    node: WorkflowNode,
    allNodes: WorkflowNode[],
    allEdges: WorkflowEdge[],
    context: WorkflowContext
  ): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create step record
    const stepResult = await db.insert(workflowExecutionSteps).values({
      executionId,
      nodeId: node.id,
      nodeType: node.type,
      nodeName: node.data?.label || node.type,
      status: 'RUNNING',
      input: JSON.stringify(node.data),
      startedAt: new Date(),
    });

    const stepId = stepResult[0].insertId;
    const startTime = Date.now();

    try {
      // Execute node based on type
      const output = await this.executeNodeAction(node, context);

      const duration = Date.now() - startTime;

      // Mark step as completed
      await db
        .update(workflowExecutionSteps)
        .set({
          status: 'COMPLETED',
          output: JSON.stringify(output),
          completedAt: new Date(),
          duration,
        })
        .where(eq(workflowExecutionSteps.id, stepId));

      // Update context with output
      if (output) {
        context.variables = { ...context.variables, ...output };
      }

      // Find and execute next nodes
      const outgoingEdges = allEdges.filter(e => e.source === node.id);

      for (const edge of outgoingEdges) {
        // Check if edge has conditions
        if (edge.data?.condition) {
          const conditionMet = this.evaluateCondition(edge.data.condition, context);
          if (!conditionMet) {
            continue; // Skip this edge
          }
        }

        const nextNode = allNodes.find(n => n.id === edge.target);
        if (nextNode) {
          await this.executeNode(executionId, nextNode, allNodes, allEdges, context);
        }
      }

    } catch (error: any) {
      console.error(`Node ${node.id} execution failed:`, error);

      const duration = Date.now() - startTime;

      // Mark step as failed
      await db
        .update(workflowExecutionSteps)
        .set({
          status: 'FAILED',
          errorMessage: error.message,
          errorStack: error.stack,
          completedAt: new Date(),
          duration,
        })
        .where(eq(workflowExecutionSteps.id, stepId));

      throw error;
    }
  }

  /**
   * Execute the action for a specific node type
   */
  private async executeNodeAction(node: WorkflowNode, context: WorkflowContext): Promise<any> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    switch (node.type) {
      case 'START':
        return { started: true };

      case 'GENERATE_LETTER':
        return await this.generateLetterAction(node, context);

      case 'FILE_CLAIM':
        return await this.fileClaimAction(node, context);

      case 'SEND_EMAIL':
        return await this.sendEmailAction(node, context);

      case 'UPDATE_STATUS':
        return await this.updateStatusAction(node, context);

      case 'WAIT':
        return await this.waitAction(node, context);

      case 'CONDITION':
        return await this.conditionAction(node, context);

      case 'CREATE_REMINDER':
        return await this.createReminderAction(node, context);

      case 'GENERATE_EVIDENCE_PACKAGE':
        return await this.generateEvidencePackageAction(node, context);

      case 'SUBMIT_TO_PORTAL':
        return await this.submitToPortalAction(node, context);

      case 'END':
        return { completed: true };

      default:
        console.warn(`Unknown node type: ${node.type}`);
        return { skipped: true };
    }
  }

  /**
   * Generate dispute letter action
   */
  private async generateLetterAction(node: WorkflowNode, context: WorkflowContext): Promise<any> {
    if (!context.caseId) {
      throw new Error('Case ID required for GENERATE_LETTER action');
    }

    const tone = node.data?.tone || 'professional';
    const format = node.data?.format || 'markdown';

    const letter = await generateDisputeLetter(context.caseId, tone);

    return {
      letterGenerated: true,
      letterContent: letter,
      tone,
      format,
    };
  }

  /**
   * File claim action (submit to carrier portal)
   */
  private async fileClaimAction(node: WorkflowNode, context: WorkflowContext): Promise<any> {
    if (!context.caseId) {
      throw new Error('Case ID required for FILE_CLAIM action');
    }

    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Get case data
    const caseData = await db
      .select()
      .from(cases)
      .where(eq(cases.id, context.caseId))
      .limit(1);

    if (caseData.length === 0) {
      throw new Error(`Case ${context.caseId} not found`);
    }

    const caseRecord = caseData[0];

    // Queue for portal submission
    const credentialId = node.data?.credentialId;
    if (!credentialId) {
      throw new Error('Credential ID required for FILE_CLAIM action');
    }

    await carrierPortalAutomation.queueSubmission({
      caseId: context.caseId,
      carrier: caseRecord.carrier as any,
      credentialId,
      submissionType: 'NEW_CLAIM',
      priority: 'HIGH',
      createdBy: context.userId || 1,
    });

    return {
      claimFiled: true,
      carrier: caseRecord.carrier,
      queuedForSubmission: true,
    };
  }

  /**
   * Send email action
   */
  private async sendEmailAction(node: WorkflowNode, context: WorkflowContext): Promise<any> {
    // TODO: Implement email sending
    const to = node.data?.to || context.variables?.recipientEmail;
    const subject = node.data?.subject || 'Claim Update';
    const body = node.data?.body || '';

    console.log(`Sending email to ${to}: ${subject}`);

    return {
      emailSent: true,
      to,
      subject,
    };
  }

  /**
   * Update case status action
   */
  private async updateStatusAction(node: WorkflowNode, context: WorkflowContext): Promise<any> {
    if (!context.caseId) {
      throw new Error('Case ID required for UPDATE_STATUS action');
    }

    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const newStatus = node.data?.status;
    if (!newStatus) {
      throw new Error('Status required for UPDATE_STATUS action');
    }

    await db
      .update(cases)
      .set({ status: newStatus })
      .where(eq(cases.id, context.caseId));

    return {
      statusUpdated: true,
      newStatus,
    };
  }

  /**
   * Wait action (delay execution)
   */
  private async waitAction(node: WorkflowNode, context: WorkflowContext): Promise<any> {
    const duration = node.data?.duration || 1000; // milliseconds
    await new Promise(resolve => setTimeout(resolve, duration));

    return {
      waited: true,
      duration,
    };
  }

  /**
   * Condition action (evaluate and branch)
   */
  private async conditionAction(node: WorkflowNode, context: WorkflowContext): Promise<any> {
    const condition = node.data?.condition;
    const result = this.evaluateCondition(condition, context);

    return {
      conditionEvaluated: true,
      result,
    };
  }

  /**
   * Create reminder action
   */
  private async createReminderAction(node: WorkflowNode, context: WorkflowContext): Promise<any> {
    // TODO: Implement reminder creation
    const reminderDate = node.data?.reminderDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const message = node.data?.message || 'Follow up on case';

    console.log(`Creating reminder for ${reminderDate}: ${message}`);

    return {
      reminderCreated: true,
      reminderDate,
      message,
    };
  }

  /**
   * Generate evidence package action
   */
  private async generateEvidencePackageAction(node: WorkflowNode, context: WorkflowContext): Promise<any> {
    if (!context.caseId) {
      throw new Error('Case ID required for GENERATE_EVIDENCE_PACKAGE action');
    }

    // TODO: Implement evidence package generation
    console.log(`Generating evidence package for case ${context.caseId}`);

    return {
      evidencePackageGenerated: true,
      caseId: context.caseId,
    };
  }

  /**
   * Submit to portal action
   */
  private async submitToPortalAction(node: WorkflowNode, context: WorkflowContext): Promise<any> {
    // Same as FILE_CLAIM but can be used for appeals, follow-ups, etc.
    return await this.fileClaimAction(node, context);
  }

  /**
   * Evaluate a condition expression
   */
  private evaluateCondition(condition: any, context: WorkflowContext): boolean {
    if (!condition) return true;

    try {
      // Simple condition evaluation
      // Format: { field: 'status', operator: 'equals', value: 'FILED' }
      const field = condition.field;
      const operator = condition.operator;
      const value = condition.value;

      const actualValue = this.getValueFromContext(field, context);

      switch (operator) {
        case 'equals':
          return actualValue === value;
        case 'notEquals':
          return actualValue !== value;
        case 'greaterThan':
          return actualValue > value;
        case 'lessThan':
          return actualValue < value;
        case 'contains':
          return String(actualValue).includes(value);
        case 'exists':
          return actualValue !== undefined && actualValue !== null;
        default:
          return true;
      }
    } catch (error) {
      console.error('Condition evaluation error:', error);
      return false;
    }
  }

  /**
   * Get value from context using dot notation
   */
  private getValueFromContext(path: string, context: WorkflowContext): any {
    const parts = path.split('.');
    let value: any = context;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Pause a workflow execution
   */
  async pauseExecution(executionId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    await db
      .update(workflowExecutions)
      .set({
        status: 'PAUSED',
        pausedAt: new Date(),
      })
      .where(eq(workflowExecutions.id, executionId));
  }

  /**
   * Resume a paused workflow execution
   */
  async resumeExecution(executionId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    await db
      .update(workflowExecutions)
      .set({
        status: 'RUNNING',
        resumedAt: new Date(),
      })
      .where(eq(workflowExecutions.id, executionId));

    // TODO: Continue execution from where it left off
  }

  /**
   * Cancel a workflow execution
   */
  async cancelExecution(executionId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    await db
      .update(workflowExecutions)
      .set({
        status: 'CANCELLED',
        completedAt: new Date(),
      })
      .where(eq(workflowExecutions.id, executionId));
  }

  /**
   * Get execution status
   */
  async getExecutionStatus(executionId: number) {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const execution = await db
      .select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.id, executionId))
      .limit(1);

    if (execution.length === 0) {
      return null;
    }

    const steps = await db
      .select()
      .from(workflowExecutionSteps)
      .where(eq(workflowExecutionSteps.executionId, executionId));

    return {
      execution: execution[0],
      steps,
    };
  }
}

// Singleton instance
export const workflowEngine = new WorkflowEngineService();
