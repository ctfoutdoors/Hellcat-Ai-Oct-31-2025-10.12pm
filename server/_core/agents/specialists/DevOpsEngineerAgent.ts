import { BaseAgent } from '../BaseAgent';
import type { AIAgent } from '../../../../drizzle/schema';

/**
 * DevOps Engineer Agent
 * 
 * Reports to: CTO
 * Department: Technology
 * 
 * Expertise:
 * - CI/CD pipeline design and optimization
 * - Infrastructure as Code (IaC)
 * - Container orchestration (Kubernetes, Docker)
 * - Cloud infrastructure management
 * - Monitoring and observability
 * - Deployment automation and reliability
 */
export class DevOpsEngineerAgent extends BaseAgent {
  constructor(agentData: AIAgent) {
    super(agentData);
  }
  
  /**
   * Get specialized system prompt for DevOps Engineer
   */
  protected getSpecializedPrompt(): string {
    return `You are a DevOps Engineer with PhD-level expertise in continuous integration/delivery, infrastructure automation, and site reliability engineering.

**CORE COMPETENCIES:**

1. **CI/CD Pipelines**
   - Pipeline design patterns (trunk-based, GitFlow, feature branches)
   - Build automation and optimization
   - Automated testing integration (unit, integration, E2E)
   - Deployment strategies (blue-green, canary, rolling)
   - Release management and versioning
   - Pipeline security and compliance

2. **Infrastructure as Code**
   - Terraform, CloudFormation, Pulumi
   - Configuration management (Ansible, Chef, Puppet)
   - Immutable infrastructure patterns
   - State management and drift detection
   - Module design and reusability
   - Multi-environment management

3. **Container Orchestration**
   - Kubernetes architecture and operations
   - Docker containerization best practices
   - Service mesh (Istio, Linkerd)
   - Pod scheduling and resource management
   - Helm charts and package management
   - Container security and scanning

4. **Cloud Infrastructure**
   - AWS, Azure, GCP services and architecture
   - Multi-cloud and hybrid cloud strategies
   - Cost optimization and FinOps
   - High availability and disaster recovery
   - Auto-scaling and load balancing
   - Network architecture and security groups

5. **Monitoring & Observability**
   - Metrics, logs, and traces (three pillars)
   - Prometheus, Grafana, ELK stack
   - Application Performance Monitoring (APM)
   - SLI, SLO, and SLA definition
   - Alerting strategies and on-call management
   - Incident response and postmortems

**ANALYTICAL FRAMEWORKS:**

- **DORA Metrics**: Deployment frequency, lead time, MTTR, change failure rate
- **SRE Principles**: Error budgets, toil reduction, reliability engineering
- **Cost Optimization**: Resource right-sizing, reserved instances, spot instances
- **Security Posture**: Vulnerability scanning, compliance automation, least privilege
- **Performance Analysis**: Latency, throughput, resource utilization

**DELIVERABLES:**

- CI/CD pipeline designs and configurations
- Infrastructure as Code templates and modules
- Kubernetes manifests and Helm charts
- Monitoring dashboards and alert rules
- Runbooks and operational procedures
- Incident postmortems and improvement plans
- Cost optimization recommendations

**COMMUNICATION STANDARDS:**

- Cite DevOps best practices and industry standards
- Provide quantified metrics (deployment frequency, MTTR, uptime)
- Reference relevant tools and technologies
- Include implementation steps and code examples
- Flag security and compliance risks
- Recommend automation opportunities

Always deliver production-ready solutions that improve reliability, efficiency, and developer experience.`;
  }
  
  /**
   * Design CI/CD pipeline
   */
  async designCICDPipeline(context: {
    project_type: string;
    tech_stack: string[];
    environments: string[];
    deployment_frequency: string;
    compliance_requirements?: string[];
  }): Promise<string> {
    const task = `Design CI/CD pipeline for ${context.project_type} project.

Tech Stack: ${context.tech_stack.join(', ')}
Environments: ${context.environments.join(', ')}
Deployment Frequency: ${context.deployment_frequency}
${context.compliance_requirements ? `Compliance: ${context.compliance_requirements.join(', ')}` : ''}

Provide:
1. Pipeline architecture diagram (stages and gates)
2. Build process optimization recommendations
3. Testing strategy (unit, integration, E2E)
4. Deployment strategy (blue-green, canary, etc.)
5. Security scanning integration (SAST, DAST, SCA)
6. Rollback and recovery procedures
7. Pipeline as Code examples (YAML/JSON)
8. Expected deployment metrics (frequency, lead time)`;

    const result = await this.executeTask(task, {
      entity_type: 'cicd_design',
    });
    
    return result.response;
  }
  
  /**
   * Optimize infrastructure costs
   */
  async optimizeInfrastructureCosts(context: {
    cloud_provider: string;
    monthly_spend: number;
    resources: Array<{
      type: string;
      count: number;
      monthly_cost: number;
      utilization: number;
    }>;
    workload_patterns?: string;
  }): Promise<string> {
    const task = `Optimize infrastructure costs for ${context.cloud_provider}.

Current Monthly Spend: $${context.monthly_spend.toLocaleString()}

Resource Breakdown:
${context.resources.map(r => 
  `- ${r.type}: ${r.count} instances, $${r.monthly_cost.toLocaleString()}/month, ${r.utilization}% utilization`
).join('\n')}

${context.workload_patterns ? `Workload Patterns: ${context.workload_patterns}` : ''}

Provide:
1. Cost optimization opportunities by resource type
2. Right-sizing recommendations
3. Reserved instance / savings plan analysis
4. Spot instance opportunities
5. Auto-scaling configuration recommendations
6. Resource consolidation strategies
7. Expected monthly savings (quantified)
8. Implementation priority and timeline`;

    const result = await this.executeTask(task, {
      entity_type: 'cost_optimization',
    });
    
    return result.response;
  }
  
  /**
   * Design Kubernetes architecture
   */
  async designKubernetesArchitecture(context: {
    application_type: string;
    expected_traffic: string;
    high_availability_required: boolean;
    services: Array<{
      name: string;
      language: string;
      dependencies: string[];
      resource_requirements: string;
    }>;
  }): Promise<string> {
    const task = `Design Kubernetes architecture for ${context.application_type}.

Expected Traffic: ${context.expected_traffic}
High Availability: ${context.high_availability_required ? 'Required' : 'Not required'}

Services (${context.services.length} microservices):
${context.services.map(s => 
  `- ${s.name} (${s.language})
  Dependencies: ${s.dependencies.join(', ')}
  Resources: ${s.resource_requirements}`
).join('\n\n')}

Provide:
1. Cluster architecture (nodes, namespaces, networking)
2. Deployment manifests for each service
3. Service mesh recommendations (if applicable)
4. Resource requests and limits
5. Horizontal Pod Autoscaler (HPA) configuration
6. Ingress and load balancing strategy
7. Persistent storage strategy
8. Monitoring and logging setup
9. Security policies and RBAC`;

    const result = await this.executeTask(task, {
      entity_type: 'kubernetes_architecture',
    });
    
    return result.response;
  }
  
  /**
   * Analyze system reliability
   */
  async analyzeReliability(context: {
    period: string;
    uptime_percentage: number;
    incidents: Array<{
      date: string;
      severity: 'critical' | 'high' | 'medium' | 'low';
      duration_minutes: number;
      root_cause: string;
    }>;
    dora_metrics: {
      deployment_frequency: string;
      lead_time_hours: number;
      mttr_minutes: number;
      change_failure_rate: number;
    };
  }): Promise<string> {
    const totalDowntime = context.incidents.reduce((sum, i) => sum + i.duration_minutes, 0);
    
    const task = `Analyze system reliability for period ${context.period}.

Uptime: ${context.uptime_percentage}%
Total Incidents: ${context.incidents.length}
Total Downtime: ${totalDowntime} minutes

Incidents by Severity:
${context.incidents.map(i => 
  `- ${i.date} (${i.severity.toUpperCase()}): ${i.duration_minutes} min - ${i.root_cause}`
).join('\n')}

DORA Metrics:
- Deployment Frequency: ${context.dora_metrics.deployment_frequency}
- Lead Time: ${context.dora_metrics.lead_time_hours} hours
- MTTR: ${context.dora_metrics.mttr_minutes} minutes
- Change Failure Rate: ${context.dora_metrics.change_failure_rate}%

Provide:
1. Reliability assessment and SLO compliance
2. Incident pattern analysis and trends
3. Root cause categorization
4. DORA metrics benchmarking
5. Toil identification and automation opportunities
6. Reliability improvement recommendations
7. Error budget analysis
8. On-call rotation optimization`;

    const result = await this.executeTask(task, {
      entity_type: 'reliability_analysis',
      entity_id: context.period,
    });
    
    return result.response;
  }
  
  /**
   * Design monitoring and alerting strategy
   */
  async designMonitoring(context: {
    services: string[];
    critical_metrics: string[];
    slos: Array<{
      metric: string;
      target: number;
      unit: string;
    }>;
    on_call_team_size: number;
  }): Promise<string> {
    const task = `Design monitoring and alerting strategy.

Services: ${context.services.join(', ')}
Critical Metrics: ${context.critical_metrics.join(', ')}

SLOs:
${context.slos.map(slo => `- ${slo.metric}: ${slo.target}${slo.unit}`).join('\n')}

On-Call Team Size: ${context.on_call_team_size}

Provide:
1. Monitoring architecture (metrics, logs, traces)
2. Dashboard designs for each service
3. Alert rules with severity levels
4. SLI/SLO/SLA definitions
5. Alert routing and escalation policies
6. Runbook templates for common issues
7. On-call rotation schedule recommendations
8. Tool recommendations (Prometheus, Grafana, PagerDuty, etc.)`;

    const result = await this.executeTask(task, {
      entity_type: 'monitoring_design',
    });
    
    return result.response;
  }
}
