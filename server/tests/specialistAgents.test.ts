import { describe, it, expect, beforeAll } from 'vitest';
import { AgentFactory } from '../_core/agents/AgentFactory';
import type { BaseAgent } from '../_core/agents/BaseAgent';

describe('Specialist Agent Teams', () => {
  let cfoAgents: Record<string, BaseAgent> = {};
  let cmoAgents: Record<string, BaseAgent> = {};
  let ctoAgents: Record<string, BaseAgent> = {};

  beforeAll(async () => {
    // Initialize core agents first
    await AgentFactory.initializeCoreAgents(1);

    // Get C-Suite executives
    const [cfo] = await AgentFactory.getAgentsByRole('cfo');
    const [cmo] = await AgentFactory.getAgentsByRole('cmo');
    const [cto] = await AgentFactory.getAgentsByRole('cto');

    // Create CFO specialist team
    cfoAgents.taxSpecialist = await AgentFactory.createAgent(
      'tax_specialist',
      'Tax Specialist',
      {
        department: 'Finance',
        team: 'CFO',
        parentAgentId: cfo?.id,
        level: 4,
      }
    );

    cfoAgents.accountingSpecialist = await AgentFactory.createAgent(
      'accounting_specialist',
      'Accounting Specialist',
      {
        department: 'Finance',
        team: 'CFO',
        parentAgentId: cfo?.id,
        level: 4,
      }
    );

    cfoAgents.budgetManager = await AgentFactory.createAgent(
      'budget_manager',
      'Budget Manager',
      {
        department: 'Finance',
        team: 'CFO',
        parentAgentId: cfo?.id,
        level: 4,
      }
    );

    // Create CMO specialist team
    cmoAgents.contentMarketing = await AgentFactory.createAgent(
      'content_marketing',
      'Content Marketing Specialist',
      {
        department: 'Marketing',
        team: 'CMO',
        parentAgentId: cmo?.id,
        level: 4,
      }
    );

    cmoAgents.seoSpecialist = await AgentFactory.createAgent(
      'seo_specialist',
      'SEO Specialist',
      {
        department: 'Marketing',
        team: 'CMO',
        parentAgentId: cmo?.id,
        level: 4,
      }
    );

    // Create CTO specialist team
    ctoAgents.devopsEngineer = await AgentFactory.createAgent(
      'devops_engineer',
      'DevOps Engineer',
      {
        department: 'Technology',
        team: 'CTO',
        parentAgentId: cto?.id,
        level: 4,
      }
    );

    ctoAgents.securitySpecialist = await AgentFactory.createAgent(
      'security_specialist',
      'Security Specialist',
      {
        department: 'Technology',
        team: 'CTO',
        parentAgentId: cto?.id,
        level: 4,
      }
    );
  });

  describe('CFO Specialist Team', () => {
    it('should create Tax Specialist agent', () => {
      expect(cfoAgents.taxSpecialist).toBeDefined();
      expect(cfoAgents.taxSpecialist.role).toBe('tax_specialist');
      expect(cfoAgents.taxSpecialist.name).toBe('Tax Specialist');
      expect(cfoAgents.taxSpecialist.department).toBe('Finance');
    });

    it('should create Accounting Specialist agent', () => {
      expect(cfoAgents.accountingSpecialist).toBeDefined();
      expect(cfoAgents.accountingSpecialist.role).toBe('accounting_specialist');
      expect(cfoAgents.accountingSpecialist.name).toBe('Accounting Specialist');
      expect(cfoAgents.accountingSpecialist.department).toBe('Finance');
    });

    it('should create Budget Manager agent', () => {
      expect(cfoAgents.budgetManager).toBeDefined();
      expect(cfoAgents.budgetManager.role).toBe('budget_manager');
      expect(cfoAgents.budgetManager.name).toBe('Budget Manager');
      expect(cfoAgents.budgetManager.department).toBe('Finance');
    });

    it('should have correct hierarchy (CFO → Tax Specialist)', async () => {
      const [cfo] = await AgentFactory.getAgentsByRole('cfo');
      expect(cfoAgents.taxSpecialist.parentAgentId).toBe(cfo?.id);
      expect(cfoAgents.taxSpecialist.level).toBe(4);
    });

    it('Tax Specialist should have specialized capabilities', () => {
      expect(cfoAgents.taxSpecialist.capabilities.analysis).toBe(true);
      expect(cfoAgents.taxSpecialist.capabilities.task_execution).toBe(true);
      expect(cfoAgents.taxSpecialist.capabilities.learning).toBe(true);
    });

    it('should execute task with Tax Specialist', async () => {
      const result = await cfoAgents.taxSpecialist.executeTask(
        'Provide a brief overview of tax planning best practices for Q4 2025.',
        { entity_type: 'test' }
      );

      expect(result).toBeDefined();
      expect(result.response).toBeDefined();
      expect(result.response.length).toBeGreaterThan(50);
      expect(result.status).toBe('completed');
    }, 30000);
  });

  describe('CMO Specialist Team', () => {
    it('should create Content Marketing agent', () => {
      expect(cmoAgents.contentMarketing).toBeDefined();
      expect(cmoAgents.contentMarketing.role).toBe('content_marketing');
      expect(cmoAgents.contentMarketing.name).toBe('Content Marketing Specialist');
      expect(cmoAgents.contentMarketing.department).toBe('Marketing');
    });

    it('should create SEO Specialist agent', () => {
      expect(cmoAgents.seoSpecialist).toBeDefined();
      expect(cmoAgents.seoSpecialist.role).toBe('seo_specialist');
      expect(cmoAgents.seoSpecialist.name).toBe('SEO Specialist');
      expect(cmoAgents.seoSpecialist.department).toBe('Marketing');
    });

    it('should have correct hierarchy (CMO → Content Marketing)', async () => {
      const [cmo] = await AgentFactory.getAgentsByRole('cmo');
      expect(cmoAgents.contentMarketing.parentAgentId).toBe(cmo?.id);
      expect(cmoAgents.contentMarketing.level).toBe(4);
    });

    it('should execute task with SEO Specialist', async () => {
      const result = await cmoAgents.seoSpecialist.executeTask(
        'Provide 3 key SEO best practices for improving organic search rankings.',
        { entity_type: 'test' }
      );

      expect(result).toBeDefined();
      expect(result.response).toBeDefined();
      expect(result.response.length).toBeGreaterThan(50);
      expect(result.status).toBe('completed');
    }, 30000);
  });

  describe('CTO Specialist Team', () => {
    it('should create DevOps Engineer agent', () => {
      expect(ctoAgents.devopsEngineer).toBeDefined();
      expect(ctoAgents.devopsEngineer.role).toBe('devops_engineer');
      expect(ctoAgents.devopsEngineer.name).toBe('DevOps Engineer');
      expect(ctoAgents.devopsEngineer.department).toBe('Technology');
    });

    it('should create Security Specialist agent', () => {
      expect(ctoAgents.securitySpecialist).toBeDefined();
      expect(ctoAgents.securitySpecialist.role).toBe('security_specialist');
      expect(ctoAgents.securitySpecialist.name).toBe('Security Specialist');
      expect(ctoAgents.securitySpecialist.department).toBe('Technology');
    });

    it('should have correct hierarchy (CTO → DevOps Engineer)', async () => {
      const [cto] = await AgentFactory.getAgentsByRole('cto');
      expect(ctoAgents.devopsEngineer.parentAgentId).toBe(cto?.id);
      expect(ctoAgents.devopsEngineer.level).toBe(4);
    });

    it('should execute task with Security Specialist', async () => {
      const result = await ctoAgents.securitySpecialist.executeTask(
        'List the top 3 OWASP security vulnerabilities that web applications should address.',
        { entity_type: 'test' }
      );

      expect(result).toBeDefined();
      expect(result.response).toBeDefined();
      expect(result.response.length).toBeGreaterThan(50);
      expect(result.status).toBe('completed');
    }, 30000);
  });

  describe('PhD-Level Response Quality', () => {
    it('Tax Specialist should provide PhD-level analysis', async () => {
      const result = await cfoAgents.taxSpecialist.executeTask(
        'Analyze the tax implications of international transfer pricing.',
        { entity_type: 'test' }
      );

      const response = result.response.toLowerCase();
      
      // Check for academic rigor indicators
      const hasStructuredAnalysis = 
        response.includes('analysis') || 
        response.includes('framework') ||
        response.includes('methodology');
      
      const hasEvidence = 
        response.includes('research') || 
        response.includes('study') ||
        response.includes('evidence') ||
        response.includes('data');

      expect(hasStructuredAnalysis || hasEvidence).toBe(true);
      expect(result.response.length).toBeGreaterThan(200); // PhD-level responses should be comprehensive
    }, 30000);

    it('SEO Specialist should provide data-driven recommendations', async () => {
      const result = await cmoAgents.seoSpecialist.executeTask(
        'Recommend an SEO strategy for improving search rankings.',
        { entity_type: 'test' }
      );

      const response = result.response.toLowerCase();
      
      // Check for data-driven approach
      const hasMetrics = 
        response.includes('metric') || 
        response.includes('data') ||
        response.includes('analysis') ||
        response.includes('measure');

      expect(hasMetrics).toBe(true);
      expect(result.response.length).toBeGreaterThan(150);
    }, 30000);
  });

  describe('Memory and Context Persistence', () => {
    it('should store conversation history for specialist agents', async () => {
      const firstTask = await cfoAgents.budgetManager.executeTask(
        'Create a budget forecast for Q1 2026 with 10% revenue growth.',
        { entity_type: 'budget_forecast', entity_id: 'Q1-2026' }
      );

      expect(firstTask.conversationId).toBeDefined();

      // Second task should reference the same conversation
      const secondTask = await cfoAgents.budgetManager.executeTask(
        'What was the revenue growth assumption in the previous forecast?',
        { 
          entity_type: 'budget_forecast', 
          entity_id: 'Q1-2026',
          conversationId: firstTask.conversationId 
        }
      );

      expect(secondTask.conversationId).toBe(firstTask.conversationId);
      expect(secondTask.response.toLowerCase()).toContain('10%');
    }, 60000);
  });

  describe('Agent Retrieval', () => {
    it('should retrieve specialist agents by role', async () => {
      const taxSpecialists = await AgentFactory.getAgentsByRole('tax_specialist');
      expect(taxSpecialists.length).toBeGreaterThan(0);
      expect(taxSpecialists[0].role).toBe('tax_specialist');
    });

    it('should retrieve agents by department', async () => {
      const financeAgents = await AgentFactory.getAgentsByDepartment('Finance');
      expect(financeAgents.length).toBeGreaterThanOrEqual(3); // At least CFO + 3 specialists
      
      const financeRoles = financeAgents.map(a => a.role);
      expect(financeRoles).toContain('tax_specialist');
      expect(financeRoles).toContain('accounting_specialist');
      expect(financeRoles).toContain('budget_manager');
    });
  });
});
