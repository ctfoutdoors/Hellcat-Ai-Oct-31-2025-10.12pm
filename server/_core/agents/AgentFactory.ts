import { getDb } from '../../db';
import { aiAgents, type InsertAIAgent, type AIAgent } from '../../../drizzle/schema';
import { BaseAgent, type AgentCapabilities, type ModelConfig } from './BaseAgent';
import { MasterAgent } from './MasterAgent';
import { CFOAgent, CMOAgent, CTOAgent, COOAgent } from './executives';
import { FinancialAnalystAgent } from './specialists/FinancialAnalystAgent';
import { TaxSpecialistAgent } from './specialists/TaxSpecialistAgent';
import { AccountingSpecialistAgent } from './specialists/AccountingSpecialistAgent';
import { BudgetManagerAgent } from './specialists/BudgetManagerAgent';
import { ContentMarketingAgent } from './specialists/ContentMarketingAgent';
import { SEOSpecialistAgent } from './specialists/SEOSpecialistAgent';
import { DevOpsEngineerAgent } from './specialists/DevOpsEngineerAgent';
import { SecuritySpecialistAgent } from './specialists/SecuritySpecialistAgent';
import { RecruiterAgent } from './specialists/RecruiterAgent';
import { HRSpecialistAgent } from './specialists/HRSpecialistAgent';
import { TrainingCoordinatorAgent } from './specialists/TrainingCoordinatorAgent';
import { SalesRepresentativeAgent } from './specialists/SalesRepresentativeAgent';
import { AccountExecutiveAgent } from './specialists/AccountExecutiveAgent';
import { CustomerSuccessManagerAgent } from './specialists/CustomerSuccessManagerAgent';
import { DataEngineerAgent } from './specialists/DataEngineerAgent';
import { BusinessAnalystAgent } from './specialists/BusinessAnalystAgent';
import { LegalCounselAgent } from './specialists/LegalCounselAgent';
import { ComplianceOfficerAgent } from './specialists/ComplianceOfficerAgent';
import { ContractSpecialistAgent } from './specialists/ContractSpecialistAgent';
import { ProductManagerAgent } from './specialists/ProductManagerAgent';
import { UXDesignerAgent } from './specialists/UXDesignerAgent';
import { QAEngineerAgent } from './specialists/QAEngineerAgent';
import { SupportAgent } from './specialists/SupportAgent';
import { OnboardingSpecialistAgent } from './specialists/OnboardingSpecialistAgent';
import { SalesEngineerAgent } from './specialists/SalesEngineerAgent';
import { CompensationAnalystAgent } from './specialists/CompensationAnalystAgent';
import { DataScientistAgent } from './specialists/DataScientistAgent';
import { eq } from 'drizzle-orm';

/**
 * Agent Factory
 * Creates and manages all AI agents in the system
 */
export class AgentFactory {
  private static agentCache: Map<number, BaseAgent> = new Map();
  
  /**
   * Create a new agent and save to database
   */
  static async createAgent(
    role: AIAgent['role'],
    name: string,
    options: {
      department?: string;
      team?: string;
      parentAgentId?: number;
      level?: number;
      capabilities?: AgentCapabilities;
      modelConfig?: ModelConfig;
      accessLevel?: number;
      canAccessPersonalData?: boolean;
    } = {}
  ): Promise<BaseAgent> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    const agentData: InsertAIAgent = {
      role,
      name,
      department: options.department || null,
      team: options.team || null,
      parentAgentId: options.parentAgentId || null,
      level: options.level ?? this.getLevelForRole(role),
      capabilities: options.capabilities || this.getDefaultCapabilities(role),
      modelConfig: options.modelConfig || this.getDefaultModelConfig(role),
      status: 'idle',
      accessLevel: options.accessLevel ?? 2,
      canAccessPersonalData: options.canAccessPersonalData ?? false,
      isActive: true,
    };
    
    const [inserted] = await db.insert(aiAgents).values(agentData);
    const agentId = inserted.insertId;
    
    // Fetch the full agent data
    const [fullAgent] = await db.select().from(aiAgents).where(eq(aiAgents.id, agentId));
    
    return this.instantiateAgent(fullAgent);
  }
  
  /**
   * Get agent by ID
   */
  static async getAgent(agentId: number): Promise<BaseAgent | null> {
    // Check cache first
    if (this.agentCache.has(agentId)) {
      return this.agentCache.get(agentId)!;
    }
    
    const db = await getDb();
    if (!db) return null;
    
    const [agentData] = await db.select().from(aiAgents).where(eq(aiAgents.id, agentId));
    if (!agentData) return null;
    
    const agent = this.instantiateAgent(agentData);
    this.agentCache.set(agentId, agent);
    
    return agent;
  }
  
  /**
   * Get all agents by role
   */
  static async getAgentsByRole(role: AIAgent['role']): Promise<BaseAgent[]> {
    const db = await getDb();
    if (!db) return [];
    
    const agentsData = await db.select().from(aiAgents).where(eq(aiAgents.role, role));
    return agentsData.map(data => this.instantiateAgent(data));
  }
  
  /**
   * Get all agents in a department
   */
  static async getAgentsByDepartment(department: string): Promise<BaseAgent[]> {
    const db = await getDb();
    if (!db) return [];
    
    const agentsData = await db.select().from(aiAgents).where(eq(aiAgents.department, department));
    return agentsData.map(data => this.instantiateAgent(data));
  }
  
  /**
   * Instantiate the correct agent class based on role
   */
  private static instantiateAgent(agentData: AIAgent): BaseAgent {
    switch (agentData.role) {
      case 'ceo':
        return new MasterAgent(agentData);
      case 'cfo':
        return new CFOAgent(agentData);
      case 'cmo':
        return new CMOAgent(agentData);
      case 'cto':
        return new CTOAgent(agentData);
      case 'coo':
        return new COOAgent(agentData);
      case 'financial_analyst':
        return new FinancialAnalystAgent(agentData);
      case 'tax_specialist':
        return new TaxSpecialistAgent(agentData);
      case 'accounting_specialist':
        return new AccountingSpecialistAgent(agentData);
      case 'budget_manager':
        return new BudgetManagerAgent(agentData);
      case 'content_marketing':
        return new ContentMarketingAgent(agentData);
      case 'seo_specialist':
        return new SEOSpecialistAgent(agentData);
      case 'devops_engineer':
        return new DevOpsEngineerAgent(agentData);
      case 'security_specialist':
        return new SecuritySpecialistAgent(agentData);
      // Add more specialized agents here
      default:
        return new BaseAgent(agentData);
    }
  }
  
  /**
   * Get default capabilities for a role
   */
  private static getDefaultCapabilities(role: AIAgent['role']): AgentCapabilities {
    // C-Suite gets all capabilities
    if (['ceo', 'cfo', 'cgo', 'cmo', 'cto', 'coo', 'chro', 'cxo', 'chief_intelligence_officer', 'clo', 'cdo', 'cso'].includes(role)) {
      return {
        analysis: true,
        decision_making: true,
        task_execution: true,
        learning: true,
        team_creation: true,
        cross_functional: true,
        multimodal: true,
      };
    }
    
    // VP-level gets most capabilities
    if (role.startsWith('vp_')) {
      return {
        analysis: true,
        decision_making: true,
        task_execution: true,
        learning: true,
        team_creation: false,
        cross_functional: true,
        multimodal: false,
      };
    }
    
    // Specialists get basic capabilities
    return {
      analysis: true,
      decision_making: false,
      task_execution: true,
      learning: true,
      team_creation: false,
      cross_functional: false,
      multimodal: false,
    };
  }
  
  /**
   * Get default model config for a role
   */
  private static getDefaultModelConfig(role: AIAgent['role']): ModelConfig {
    // C-Suite uses GPT-4o for best performance
    if (['ceo', 'cfo', 'cgo', 'cmo', 'cto', 'coo', 'chro', 'cxo', 'chief_intelligence_officer', 'clo', 'cdo', 'cso'].includes(role)) {
      return {
        model: 'gpt-4o',
        temperature: 0.7,
        max_tokens: 4000,
      };
    }
    
    // Everyone else uses GPT-4o but with lower token limits
    return {
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 2000,
    };
  }
  
  /**
   * Get hierarchical level for a role
   */
  private static getLevelForRole(role: AIAgent['role']): number {
    if (role === 'ceo') return 0;
    if (['cfo', 'cgo', 'cmo', 'cto', 'coo', 'chro', 'cxo', 'chief_intelligence_officer', 'clo', 'cdo', 'cso'].includes(role)) return 1;
    if (role.startsWith('vp_')) return 2;
    if (['manager', 'coordinator'].includes(role)) return 3;
    return 4; // Specialists
  }
  
  /**
   * Initialize the core enterprise agents (CEO + C-Suite)
   */
  static async initializeCoreAgents(ownerId: number): Promise<{
    ceo: BaseAgent;
    cSuite: Record<string, BaseAgent>;
  }> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    // Check if CEO already exists
    const [existingCEO] = await db.select().from(aiAgents).where(eq(aiAgents.role, 'ceo'));
    
    let ceo: BaseAgent;
    if (existingCEO) {
      ceo = this.instantiateAgent(existingCEO);
    } else {
      // Create CEO (Master Agent)
      ceo = await this.createAgent('ceo', 'Master AI Agent', {
        level: 0,
        accessLevel: 5,
        canAccessPersonalData: true,
      });
    }
    
    // Create C-Suite if they don't exist
    const cSuite: Record<string, BaseAgent> = {};
    
    const cSuiteRoles: Array<{ role: AIAgent['role']; name: string; department: string }> = [
      { role: 'cfo', name: 'Chief Financial Officer', department: 'Finance' },
      { role: 'cmo', name: 'Chief Marketing Officer', department: 'Marketing' },
      { role: 'cto', name: 'Chief Technology Officer', department: 'Technology' },
      { role: 'coo', name: 'Chief Operating Officer', department: 'Operations' },
      { role: 'chro', name: 'Chief Human Resources Officer', department: 'Human Resources' },
      { role: 'cxo', name: 'Chief Experience Officer', department: 'Customer Experience' },
      { role: 'chief_intelligence_officer', name: 'Chief Intelligence Officer', department: 'Intelligence' },
      { role: 'clo', name: 'Chief Legal Officer', department: 'Legal' },
      { role: 'cdo', name: 'Chief Data Officer', department: 'Data & Analytics' },
      { role: 'cso', name: 'Chief Security Officer', department: 'Security' },
      { role: 'cgo', name: 'Chief Growth Officer', department: 'Growth' },
    ];
    
    for (const { role, name, department } of cSuiteRoles) {
      const [existing] = await db.select().from(aiAgents).where(eq(aiAgents.role, role));
      
      if (existing) {
        cSuite[role] = this.instantiateAgent(existing);
      } else {
        cSuite[role] = await this.createAgent(role, name, {
          department,
          parentAgentId: ceo.id,
          level: 1,
          accessLevel: 4,
        });
      }
    }
    
    return { ceo, cSuite };
  }
  
  /**
   * Initialize specialist agents for all departments
   */
  static async initializeSpecialistAgents(ceoId: number, cSuite: Record<string, BaseAgent>): Promise<Record<string, BaseAgent>> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    const specialists: Record<string, BaseAgent> = {};
    
    const specialistConfigs: Array<{
      role: AIAgent['role'];
      name: string;
      department: string;
      parentRole: string;
    }> = [
      // CFO Team
      { role: 'financial_analyst', name: 'Financial Analyst', department: 'Finance', parentRole: 'cfo' },
      { role: 'tax_specialist', name: 'Tax Specialist', department: 'Finance', parentRole: 'cfo' },
      { role: 'accounting_specialist', name: 'Accounting Specialist', department: 'Finance', parentRole: 'cfo' },
      { role: 'budget_manager', name: 'Budget Manager', department: 'Finance', parentRole: 'cfo' },
      
      // CMO Team
      { role: 'content_marketing', name: 'Content Marketing Specialist', department: 'Marketing', parentRole: 'cmo' },
      { role: 'seo_specialist', name: 'SEO Specialist', department: 'Marketing', parentRole: 'cmo' },
      
      // CTO Team
      { role: 'devops_engineer', name: 'DevOps Engineer', department: 'Technology', parentRole: 'cto' },
      { role: 'security_specialist', name: 'Security Specialist', department: 'Technology', parentRole: 'cto' },
      { role: 'qa_engineer', name: 'QA Engineer', department: 'Technology', parentRole: 'cto' },
      
      // CHRO Team
      { role: 'recruiter', name: 'Recruiter', department: 'Human Resources', parentRole: 'chro' },
      { role: 'hr_specialist', name: 'HR Specialist', department: 'Human Resources', parentRole: 'chro' },
      { role: 'training_coordinator', name: 'Training Coordinator', department: 'Human Resources', parentRole: 'chro' },
      { role: 'compensation_analyst', name: 'Compensation Analyst', department: 'Human Resources', parentRole: 'chro' },
      
      // Sales Team (under CGO)
      { role: 'sales_representative', name: 'Sales Representative', department: 'Sales', parentRole: 'cgo' },
      { role: 'account_executive', name: 'Account Executive', department: 'Sales', parentRole: 'cgo' },
      { role: 'sales_engineer', name: 'Sales Engineer', department: 'Sales', parentRole: 'cgo' },
      
      // Customer Success Team (under CXO)
      { role: 'customer_success_manager', name: 'Customer Success Manager', department: 'Customer Success', parentRole: 'cxo' },
      { role: 'support_agent', name: 'Support Agent', department: 'Customer Success', parentRole: 'cxo' },
      { role: 'onboarding_specialist', name: 'Onboarding Specialist', department: 'Customer Success', parentRole: 'cxo' },
      
      // Data Team (under CDO)
      { role: 'data_engineer', name: 'Data Engineer', department: 'Data & Analytics', parentRole: 'cdo' },
      { role: 'data_scientist', name: 'Data Scientist', department: 'Data & Analytics', parentRole: 'cdo' },
      { role: 'business_analyst', name: 'Business Analyst', department: 'Data & Analytics', parentRole: 'cdo' },
      
      // Legal Team (under CLO)
      { role: 'legal_counsel', name: 'Legal Counsel', department: 'Legal', parentRole: 'clo' },
      { role: 'compliance_officer', name: 'Compliance Officer', department: 'Legal', parentRole: 'clo' },
      { role: 'contract_specialist', name: 'Contract Specialist', department: 'Legal', parentRole: 'clo' },
      
      // Product Team (under CTO)
      { role: 'product_manager', name: 'Product Manager', department: 'Product', parentRole: 'cto' },
      { role: 'ux_designer', name: 'UX Designer', department: 'Product', parentRole: 'cto' },
    ];
    
    for (const { role, name, department, parentRole } of specialistConfigs) {
      const [existing] = await db.select().from(aiAgents).where(eq(aiAgents.role, role));
      
      if (existing) {
        specialists[role] = this.instantiateAgent(existing);
      } else {
        const parentAgent = cSuite[parentRole];
        if (parentAgent) {
          specialists[role] = await this.createAgent(role, name, {
            department,
            parentAgentId: parentAgent.id,
            level: 4,
            accessLevel: 2,
          });
        }
      }
    }
    
    return specialists;
  }
}
