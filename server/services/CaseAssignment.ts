import { getDb } from '../db';
import {
  teamMembers,
  assignmentRules,
  caseAssignments,
  cases,
} from '../../drizzle/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

interface AssignmentCandidate {
  teamMemberId: number;
  score: number;
  reason: string;
  workload: number;
  specialization: boolean;
  performance: number;
}

export class CaseAssignmentService {
  /**
   * Auto-assign a case to the best team member
   */
  async autoAssignCase(caseId: number): Promise<number | null> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Get case details
    const caseResult = await db
      .select()
      .from(cases)
      .where(eq(cases.id, caseId))
      .limit(1);

    if (caseResult.length === 0) {
      throw new Error('Case not found');
    }

    const caseData = caseResult[0];

    // Find applicable assignment rules
    const rules = await db
      .select()
      .from(assignmentRules)
      .where(eq(assignmentRules.isActive, true))
      .orderBy(desc(assignmentRules.priority));

    // Try to find a rule that matches
    for (const rule of rules) {
      if (this.doesRuleMatch(rule, caseData)) {
        // Use this rule's strategy
        const teamMemberId = await this.assignByStrategy(
          rule.strategy,
          caseData,
          rule.assignToRole,
          rule.assignToUserId
        );

        if (teamMemberId) {
          await this.createAssignment(caseId, teamMemberId, 'RULE_BASED', rule.id);
          
          // Update rule stats
          await db
            .update(assignmentRules)
            .set({
              assignmentCount: sql`${assignmentRules.assignmentCount} + 1`,
            })
            .where(eq(assignmentRules.id, rule.id));

          return teamMemberId;
        }
      }
    }

    // No rule matched, use default strategy (LEAST_LOADED)
    const teamMemberId = await this.assignByStrategy('LEAST_LOADED', caseData);
    
    if (teamMemberId) {
      await this.createAssignment(caseId, teamMemberId, 'AUTO');
      return teamMemberId;
    }

    return null;
  }

  /**
   * Check if assignment rule matches case
   */
  private doesRuleMatch(rule: any, caseData: any): boolean {
    // Check carrier
    if (rule.carrier && rule.carrier !== 'ALL' && rule.carrier !== caseData.carrier) {
      return false;
    }

    // Check issue type
    if (rule.issueType && rule.issueType !== caseData.issueType) {
      return false;
    }

    // Check priority
    if (rule.priority && rule.priority !== 'ALL' && rule.priority !== caseData.priority) {
      return false;
    }

    // Check amount range
    if (rule.amountRange) {
      const range = JSON.parse(rule.amountRange);
      const amount = caseData.claimedAmount || 0;
      if (amount < range.min || amount > range.max) {
        return false;
      }
    }

    return true;
  }

  /**
   * Assign case using specified strategy
   */
  private async assignByStrategy(
    strategy: string,
    caseData: any,
    targetRole?: string,
    targetUserId?: number
  ): Promise<number | null> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Get available team members
    let query = db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.isActive, true),
          eq(teamMembers.isAvailable, true)
        )
      );

    // Filter by role if specified
    if (targetRole) {
      query = query.where(eq(teamMembers.role, targetRole)) as any;
    }

    // Filter by specific user if specified
    if (targetUserId) {
      query = query.where(eq(teamMembers.userId, targetUserId)) as any;
    }

    const availableMembers = await query;

    if (availableMembers.length === 0) {
      return null;
    }

    // Filter out overloaded members
    const eligibleMembers = availableMembers.filter(
      m => m.currentCaseCount < m.maxConcurrentCases
    );

    if (eligibleMembers.length === 0) {
      return null;
    }

    switch (strategy) {
      case 'ROUND_ROBIN':
        return this.assignRoundRobin(eligibleMembers);
      
      case 'LEAST_LOADED':
        return this.assignLeastLoaded(eligibleMembers);
      
      case 'SPECIALIZED':
        return this.assignSpecialized(eligibleMembers, caseData);
      
      case 'RANDOM':
        return this.assignRandom(eligibleMembers);
      
      default:
        return this.assignLeastLoaded(eligibleMembers);
    }
  }

  /**
   * Round-robin assignment (based on last assigned time)
   */
  private assignRoundRobin(members: any[]): number {
    // Sort by last assigned time (oldest first)
    members.sort((a, b) => {
      const aTime = a.lastAssignedAt ? new Date(a.lastAssignedAt).getTime() : 0;
      const bTime = b.lastAssignedAt ? new Date(b.lastAssignedAt).getTime() : 0;
      return aTime - bTime;
    });

    return members[0].id;
  }

  /**
   * Assign to least loaded team member
   */
  private assignLeastLoaded(members: any[]): number {
    // Sort by current case count (ascending)
    members.sort((a, b) => a.currentCaseCount - b.currentCaseCount);
    return members[0].id;
  }

  /**
   * Assign based on specialization and performance
   */
  private assignSpecialized(members: any[], caseData: any): number {
    const candidates: AssignmentCandidate[] = [];

    for (const member of members) {
      let score = 0;
      const reasons: string[] = [];

      // Check carrier specialization
      const carrierSpecialties = member.carrierSpecialties
        ? JSON.parse(member.carrierSpecialties)
        : [];
      const hasCarrierSpecialty = carrierSpecialties.includes(caseData.carrier);
      if (hasCarrierSpecialty) {
        score += 40;
        reasons.push('Carrier specialist');
      }

      // Check issue type specialization
      const issueSpecialties = member.issueTypeSpecialties
        ? JSON.parse(member.issueTypeSpecialties)
        : [];
      const hasIssueSpecialty = issueSpecialties.includes(caseData.issueType);
      if (hasIssueSpecialty) {
        score += 30;
        reasons.push('Issue type specialist');
      }

      // Consider workload (lower is better)
      const workloadScore = Math.max(0, 100 - (member.currentCaseCount / member.maxConcurrentCases) * 100);
      score += workloadScore * 0.2;

      // Consider success rate
      score += member.successRate * 0.1;

      candidates.push({
        teamMemberId: member.id,
        score,
        reason: reasons.join(', ') || 'General assignment',
        workload: member.currentCaseCount,
        specialization: hasCarrierSpecialty || hasIssueSpecialty,
        performance: member.successRate,
      });
    }

    // Sort by score (descending)
    candidates.sort((a, b) => b.score - a.score);

    return candidates[0].teamMemberId;
  }

  /**
   * Random assignment
   */
  private assignRandom(members: any[]): number {
    const randomIndex = Math.floor(Math.random() * members.length);
    return members[randomIndex].id;
  }

  /**
   * Create case assignment record
   */
  private async createAssignment(
    caseId: number,
    teamMemberId: number,
    method: 'AUTO' | 'MANUAL' | 'RULE_BASED',
    ruleId?: number,
    assignedBy?: number
  ): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create assignment
    await db.insert(caseAssignments).values({
      caseId,
      assignedTo: teamMemberId,
      assignmentMethod: method,
      assignmentRuleId: ruleId,
      assignedBy,
    });

    // Update case
    await db
      .update(cases)
      .set({ assignedTo: teamMemberId })
      .where(eq(cases.id, caseId));

    // Update team member workload
    await db
      .update(teamMembers)
      .set({
        currentCaseCount: sql`${teamMembers.currentCaseCount} + 1`,
        lastAssignedAt: new Date(),
      })
      .where(eq(teamMembers.id, teamMemberId));
  }

  /**
   * Manually assign case to team member
   */
  async manualAssignCase(
    caseId: number,
    teamMemberId: number,
    assignedBy: number
  ): Promise<void> {
    await this.createAssignment(caseId, teamMemberId, 'MANUAL', undefined, assignedBy);
  }

  /**
   * Reassign case to different team member
   */
  async reassignCase(
    caseId: number,
    newTeamMemberId: number,
    reassignedBy: number
  ): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Get current assignment
    const currentAssignment = await db
      .select()
      .from(caseAssignments)
      .where(
        and(
          eq(caseAssignments.caseId, caseId),
          eq(caseAssignments.status, 'ACTIVE')
        )
      )
      .limit(1);

    if (currentAssignment.length > 0) {
      const oldTeamMemberId = currentAssignment[0].assignedTo;

      // Mark old assignment as reassigned
      await db
        .update(caseAssignments)
        .set({ status: 'REASSIGNED' })
        .where(eq(caseAssignments.id, currentAssignment[0].id));

      // Decrease old team member's workload
      await db
        .update(teamMembers)
        .set({
          currentCaseCount: sql`${teamMembers.currentCaseCount} - 1`,
        })
        .where(eq(teamMembers.id, oldTeamMemberId));
    }

    // Create new assignment
    await this.createAssignment(caseId, newTeamMemberId, 'MANUAL', undefined, reassignedBy);
  }

  /**
   * Complete case assignment
   */
  async completeAssignment(caseId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Get active assignment
    const assignment = await db
      .select()
      .from(caseAssignments)
      .where(
        and(
          eq(caseAssignments.caseId, caseId),
          eq(caseAssignments.status, 'ACTIVE')
        )
      )
      .limit(1);

    if (assignment.length > 0) {
      const completedAt = new Date();
      const timeToComplete = Math.floor(
        (completedAt.getTime() - assignment[0].assignedAt.getTime()) / (1000 * 60)
      );

      // Update assignment
      await db
        .update(caseAssignments)
        .set({
          status: 'COMPLETED',
          completedAt,
          timeToComplete,
        })
        .where(eq(caseAssignments.id, assignment[0].id));

      // Decrease team member's workload
      await db
        .update(teamMembers)
        .set({
          currentCaseCount: sql`${teamMembers.currentCaseCount} - 1`,
          totalCasesHandled: sql`${teamMembers.totalCasesHandled} + 1`,
        })
        .where(eq(teamMembers.id, assignment[0].assignedTo));
    }
  }

  /**
   * Get team member workload
   */
  async getTeamWorkload(): Promise<any[]> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const members = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.isActive, true));

    return members.map(m => ({
      ...m,
      utilizationRate: m.maxConcurrentCases > 0
        ? Math.round((m.currentCaseCount / m.maxConcurrentCases) * 100)
        : 0,
      carrierSpecialties: m.carrierSpecialties ? JSON.parse(m.carrierSpecialties) : [],
      issueTypeSpecialties: m.issueTypeSpecialties ? JSON.parse(m.issueTypeSpecialties) : [],
    }));
  }

  /**
   * Balance workload across team
   */
  async balanceWorkload(): Promise<number> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const members = await this.getTeamWorkload();
    
    // Find overloaded and underloaded members
    const overloaded = members.filter(m => m.utilizationRate > 90);
    const underloaded = members.filter(m => m.utilizationRate < 50);

    if (overloaded.length === 0 || underloaded.length === 0) {
      return 0; // No balancing needed
    }

    let rebalancedCount = 0;

    // For each overloaded member, try to move some cases
    for (const overloadedMember of overloaded) {
      // Get their active cases
      const activeCases = await db
        .select()
        .from(caseAssignments)
        .where(
          and(
            eq(caseAssignments.assignedTo, overloadedMember.id),
            eq(caseAssignments.status, 'ACTIVE')
          )
        )
        .limit(5); // Only move up to 5 cases at a time

      for (const assignment of activeCases) {
        if (underloaded.length === 0) break;

        // Assign to least loaded underloaded member
        const targetMember = underloaded[0];
        
        await this.reassignCase(assignment.caseId, targetMember.id, 1); // System user
        rebalancedCount++;

        // Update utilization
        targetMember.currentCaseCount++;
        targetMember.utilizationRate = Math.round(
          (targetMember.currentCaseCount / targetMember.maxConcurrentCases) * 100
        );

        // Remove from underloaded if now balanced
        if (targetMember.utilizationRate >= 50) {
          underloaded.shift();
        }
      }
    }

    return rebalancedCount;
  }
}

// Singleton instance
export const caseAssignment = new CaseAssignmentService();
