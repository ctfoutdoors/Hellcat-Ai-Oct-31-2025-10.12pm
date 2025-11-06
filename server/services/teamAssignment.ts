/**
 * Team Assignment Workflows Service
 * 
 * Assign cases to team members with smart routing and notifications
 * Supports workload balancing, skill-based routing, and escalation rules
 */

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: 'agent' | 'senior_agent' | 'supervisor' | 'manager';
  skills: string[]; // e.g., ['FedEx', 'high-value', 'escalations']
  maxCaseload: number;
  currentCaseload: number;
  availability: 'available' | 'busy' | 'away' | 'offline';
  avgResolutionTime: number; // in hours
  successRate: number; // 0-1
}

interface AssignmentRule {
  id: string;
  name: string;
  priority: number;
  conditions: {
    carrier?: string[];
    priority?: string[];
    amountRange?: { min?: number; max?: number };
    status?: string[];
    tags?: string[];
  };
  assignTo: 'round_robin' | 'least_loaded' | 'most_skilled' | 'specific_user';
  targetUserId?: number;
  autoAssign: boolean;
  notifyAssignee: boolean;
  escalateAfterHours?: number;
}

interface Assignment {
  id: string;
  caseId: number;
  assignedTo: number;
  assignedBy: number;
  assignedAt: Date;
  dueDate?: Date;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'escalated';
  notes?: string;
  escalatedTo?: number;
  escalatedAt?: Date;
}

export class TeamAssignmentService {
  private static teamMembers: Map<number, TeamMember> = new Map();
  private static assignments: Map<number, Assignment> = new Map(); // caseId -> Assignment
  private static rules: AssignmentRule[] = [];
  private static assignmentHistory: Assignment[] = [];

  /**
   * Add team member
   */
  static addTeamMember(member: TeamMember): void {
    this.teamMembers.set(member.id, member);
  }

  /**
   * Get team member
   */
  static getTeamMember(userId: number): TeamMember | undefined {
    return this.teamMembers.get(userId);
  }

  /**
   * Get all team members
   */
  static getAllTeamMembers(filters?: {
    role?: TeamMember['role'];
    availability?: TeamMember['availability'];
    skills?: string[];
  }): TeamMember[] {
    let members = Array.from(this.teamMembers.values());

    if (filters?.role) {
      members = members.filter(m => m.role === filters.role);
    }

    if (filters?.availability) {
      members = members.filter(m => m.availability === filters.availability);
    }

    if (filters?.skills && filters.skills.length > 0) {
      members = members.filter(m =>
        filters.skills!.some(skill => m.skills.includes(skill))
      );
    }

    return members;
  }

  /**
   * Assign case to team member
   */
  static assignCase(params: {
    caseId: number;
    assignedTo: number;
    assignedBy: number;
    priority?: Assignment['priority'];
    dueDate?: Date;
    notes?: string;
    autoAssign?: boolean;
  }): Assignment {
    const assignment: Assignment = {
      id: `assign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      caseId: params.caseId,
      assignedTo: params.assignedTo,
      assignedBy: params.assignedBy,
      assignedAt: new Date(),
      dueDate: params.dueDate,
      priority: params.priority || 'MEDIUM',
      status: 'pending',
      notes: params.notes,
    };

    this.assignments.set(params.caseId, assignment);
    this.assignmentHistory.push(assignment);

    // Update team member caseload
    const member = this.teamMembers.get(params.assignedTo);
    if (member) {
      member.currentCaseload++;
      this.teamMembers.set(params.assignedTo, member);
    }

    return assignment;
  }

  /**
   * Auto-assign case based on rules
   */
  static autoAssignCase(params: {
    caseId: number;
    caseData: {
      carrier?: string;
      priority?: string;
      claimedAmount?: number;
      status?: string;
      tags?: string[];
    };
    assignedBy: number;
  }): Assignment | null {
    // Find matching rule
    const matchingRule = this.findMatchingRule(params.caseData);
    if (!matchingRule || !matchingRule.autoAssign) {
      return null;
    }

    // Find best assignee based on rule strategy
    const assignee = this.findBestAssignee(matchingRule, params.caseData);
    if (!assignee) {
      return null;
    }

    return this.assignCase({
      caseId: params.caseId,
      assignedTo: assignee.id,
      assignedBy: params.assignedBy,
      priority: params.caseData.priority as Assignment['priority'],
      autoAssign: true,
    });
  }

  /**
   * Reassign case
   */
  static reassignCase(params: {
    caseId: number;
    newAssignee: number;
    reassignedBy: number;
    reason?: string;
  }): Assignment | null {
    const currentAssignment = this.assignments.get(params.caseId);
    if (!currentAssignment) {
      return null;
    }

    // Update old assignee caseload
    const oldMember = this.teamMembers.get(currentAssignment.assignedTo);
    if (oldMember && oldMember.currentCaseload > 0) {
      oldMember.currentCaseload--;
      this.teamMembers.set(oldMember.id, oldMember);
    }

    // Create new assignment
    const newAssignment: Assignment = {
      ...currentAssignment,
      id: `assign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      assignedTo: params.newAssignee,
      assignedBy: params.reassignedBy,
      assignedAt: new Date(),
      status: 'pending',
      notes: params.reason,
    };

    this.assignments.set(params.caseId, newAssignment);
    this.assignmentHistory.push(newAssignment);

    // Update new assignee caseload
    const newMember = this.teamMembers.get(params.newAssignee);
    if (newMember) {
      newMember.currentCaseload++;
      this.teamMembers.set(newMember.id, newMember);
    }

    return newAssignment;
  }

  /**
   * Escalate case
   */
  static escalateCase(params: {
    caseId: number;
    escalatedTo: number;
    escalatedBy: number;
    reason: string;
  }): Assignment | null {
    const assignment = this.assignments.get(params.caseId);
    if (!assignment) {
      return null;
    }

    assignment.status = 'escalated';
    assignment.escalatedTo = params.escalatedTo;
    assignment.escalatedAt = new Date();
    assignment.notes = (assignment.notes || '') + `\nEscalated: ${params.reason}`;

    this.assignments.set(params.caseId, assignment);

    return assignment;
  }

  /**
   * Get assignment for case
   */
  static getAssignment(caseId: number): Assignment | undefined {
    return this.assignments.get(caseId);
  }

  /**
   * Get assignments for user
   */
  static getUserAssignments(userId: number, status?: Assignment['status']): Assignment[] {
    const assignments = Array.from(this.assignments.values())
      .filter(a => a.assignedTo === userId);

    if (status) {
      return assignments.filter(a => a.status === status);
    }

    return assignments;
  }

  /**
   * Get assignment history for case
   */
  static getAssignmentHistory(caseId: number): Assignment[] {
    return this.assignmentHistory.filter(a => a.caseId === caseId);
  }

  /**
   * Add assignment rule
   */
  static addRule(rule: AssignmentRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get all rules
   */
  static getRules(): AssignmentRule[] {
    return this.rules;
  }

  /**
   * Find matching rule for case
   */
  private static findMatchingRule(caseData: {
    carrier?: string;
    priority?: string;
    claimedAmount?: number;
    status?: string;
    tags?: string[];
  }): AssignmentRule | undefined {
    for (const rule of this.rules) {
      if (this.ruleMatches(rule, caseData)) {
        return rule;
      }
    }
    return undefined;
  }

  /**
   * Check if rule matches case
   */
  private static ruleMatches(rule: AssignmentRule, caseData: any): boolean {
    const { conditions } = rule;

    if (conditions.carrier && caseData.carrier) {
      if (!conditions.carrier.includes(caseData.carrier)) {
        return false;
      }
    }

    if (conditions.priority && caseData.priority) {
      if (!conditions.priority.includes(caseData.priority)) {
        return false;
      }
    }

    if (conditions.amountRange && caseData.claimedAmount !== undefined) {
      const { min, max } = conditions.amountRange;
      if (min !== undefined && caseData.claimedAmount < min) {
        return false;
      }
      if (max !== undefined && caseData.claimedAmount > max) {
        return false;
      }
    }

    if (conditions.status && caseData.status) {
      if (!conditions.status.includes(caseData.status)) {
        return false;
      }
    }

    if (conditions.tags && caseData.tags) {
      const hasMatchingTag = conditions.tags.some(tag => caseData.tags.includes(tag));
      if (!hasMatchingTag) {
        return false;
      }
    }

    return true;
  }

  /**
   * Find best assignee based on strategy
   */
  private static findBestAssignee(
    rule: AssignmentRule,
    caseData: any
  ): TeamMember | undefined {
    const availableMembers = this.getAllTeamMembers({
      availability: 'available',
    }).filter(m => m.currentCaseload < m.maxCaseload);

    if (availableMembers.length === 0) {
      return undefined;
    }

    switch (rule.assignTo) {
      case 'specific_user':
        return rule.targetUserId ? this.teamMembers.get(rule.targetUserId) : undefined;

      case 'round_robin':
        // Simple round robin: least recently assigned
        return availableMembers.sort((a, b) => {
          const aLastAssignment = this.assignmentHistory
            .filter(h => h.assignedTo === a.id)
            .sort((x, y) => y.assignedAt.getTime() - x.assignedAt.getTime())[0];
          const bLastAssignment = this.assignmentHistory
            .filter(h => h.assignedTo === b.id)
            .sort((x, y) => y.assignedAt.getTime() - x.assignedAt.getTime())[0];

          const aTime = aLastAssignment?.assignedAt.getTime() || 0;
          const bTime = bLastAssignment?.assignedAt.getTime() || 0;

          return aTime - bTime;
        })[0];

      case 'least_loaded':
        return availableMembers.sort((a, b) => a.currentCaseload - b.currentCaseload)[0];

      case 'most_skilled':
        // Find member with best success rate for this carrier
        const carrier = caseData.carrier;
        const skilledMembers = carrier
          ? availableMembers.filter(m => m.skills.includes(carrier))
          : availableMembers;

        return skilledMembers.sort((a, b) => b.successRate - a.successRate)[0];

      default:
        return availableMembers[0];
    }
  }

  /**
   * Get workload statistics
   */
  static getWorkloadStats() {
    const members = Array.from(this.teamMembers.values());

    return {
      totalMembers: members.length,
      available: members.filter(m => m.availability === 'available').length,
      busy: members.filter(m => m.availability === 'busy').length,
      away: members.filter(m => m.availability === 'away').length,
      totalCaseload: members.reduce((sum, m) => sum + m.currentCaseload, 0),
      avgCaseload: members.length > 0
        ? members.reduce((sum, m) => sum + m.currentCaseload, 0) / members.length
        : 0,
      overloaded: members.filter(m => m.currentCaseload >= m.maxCaseload).length,
    };
  }
}
