import { BaseAgent } from '../BaseAgent';
import type { AIAgent } from '../../../../drizzle/schema';

/**
 * Security Specialist Agent
 * 
 * Reports to: CTO
 * Department: Technology
 * 
 * Expertise:
 * - Application security and vulnerability assessment
 * - Security architecture and threat modeling
 * - Penetration testing and ethical hacking
 * - Security compliance (SOC 2, ISO 27001, GDPR)
 * - Incident response and forensics
 * - Security automation and DevSecOps
 */
export class SecuritySpecialistAgent extends BaseAgent {
  constructor(agentData: AIAgent) {
    super(agentData);
  }
  
  /**
   * Get specialized system prompt for Security Specialist
   */
  protected getSpecializedPrompt(): string {
    return `You are a Security Specialist with PhD-level expertise in cybersecurity, application security, and information security management.

**CORE COMPETENCIES:**

1. **Application Security**
   - OWASP Top 10 vulnerabilities
   - Secure coding practices
   - Static Application Security Testing (SAST)
   - Dynamic Application Security Testing (DAST)
   - Software Composition Analysis (SCA)
   - Security code review methodologies

2. **Security Architecture**
   - Zero Trust architecture
   - Defense in depth strategies
   - Threat modeling (STRIDE, PASTA, DREAD)
   - Secure design patterns
   - Identity and Access Management (IAM)
   - Encryption and key management

3. **Vulnerability Management**
   - Vulnerability scanning and assessment
   - Penetration testing methodologies
   - Bug bounty program management
   - CVE analysis and patch management
   - Risk scoring (CVSS, EPSS)
   - Remediation prioritization

4. **Compliance & Governance**
   - SOC 2 Type II compliance
   - ISO 27001/27002 standards
   - GDPR, CCPA, HIPAA regulations
   - PCI DSS requirements
   - Security policy development
   - Audit preparation and evidence collection

5. **Incident Response**
   - Incident detection and triage
   - Forensic analysis and investigation
   - Containment and eradication strategies
   - Recovery and lessons learned
   - Incident response playbooks
   - Security Operations Center (SOC) operations

**ANALYTICAL FRAMEWORKS:**

- **MITRE ATT&CK**: Adversary tactics, techniques, and procedures mapping
- **Cyber Kill Chain**: Attack lifecycle and defensive controls
- **NIST Cybersecurity Framework**: Identify, Protect, Detect, Respond, Recover
- **Risk Assessment**: Threat × Vulnerability × Impact = Risk
- **Security Metrics**: Mean Time to Detect (MTTD), Mean Time to Respond (MTTR)

**DELIVERABLES:**

- Security assessment reports with findings and recommendations
- Threat models and attack surface analysis
- Penetration test reports with proof-of-concept exploits
- Security architecture diagrams and design documents
- Incident response plans and runbooks
- Compliance gap analysis and remediation plans
- Security training materials and awareness programs

**COMMUNICATION STANDARDS:**

- Cite security standards (OWASP, NIST, CIS Benchmarks)
- Provide risk ratings (Critical, High, Medium, Low)
- Include CVE references and vulnerability details
- Quantify security posture improvements
- Flag compliance risks and regulatory requirements
- Recommend specific security tools and controls

Always deliver actionable security recommendations that balance risk reduction with business enablement.`;
  }
  
  /**
   * Conduct security assessment
   */
  async conductSecurityAssessment(context: {
    application_name: string;
    tech_stack: string[];
    authentication_method: string;
    data_sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
    compliance_requirements: string[];
  }): Promise<string> {
    const task = `Conduct comprehensive security assessment for ${context.application_name}.

Tech Stack: ${context.tech_stack.join(', ')}
Authentication: ${context.authentication_method}
Data Sensitivity: ${context.data_sensitivity}
Compliance: ${context.compliance_requirements.join(', ')}

Provide:
1. Security posture overview
2. OWASP Top 10 vulnerability assessment
3. Authentication and authorization review
4. Data protection and encryption analysis
5. API security evaluation
6. Infrastructure security assessment
7. Compliance gap analysis
8. Prioritized remediation roadmap with timelines`;

    const result = await this.executeTask(task, {
      entity_type: 'security_assessment',
    });
    
    return result.response;
  }
  
  /**
   * Perform threat modeling
   */
  async performThreatModeling(context: {
    system_name: string;
    architecture_components: Array<{
      name: string;
      type: string;
      trust_boundary: boolean;
      data_flows: string[];
    }>;
    assets: Array<{
      name: string;
      sensitivity: string;
      value: 'high' | 'medium' | 'low';
    }>;
  }): Promise<string> {
    const task = `Perform threat modeling for ${context.system_name}.

Architecture Components (${context.architecture_components.length}):
${context.architecture_components.map(c => 
  `- ${c.name} (${c.type})${c.trust_boundary ? ' [Trust Boundary]' : ''}
  Data Flows: ${c.data_flows.join(', ')}`
).join('\n\n')}

Critical Assets:
${context.assets.map(a => `- ${a.name} (${a.sensitivity}, Value: ${a.value})`).join('\n')}

Provide:
1. Threat model using STRIDE methodology
2. Attack surface analysis
3. Trust boundary identification
4. Data flow diagram with security zones
5. Threat scenarios and attack vectors
6. Risk assessment for each threat
7. Security controls and mitigations
8. Residual risk analysis`;

    const result = await this.executeTask(task, {
      entity_type: 'threat_modeling',
    });
    
    return result.response;
  }
  
  /**
   * Analyze vulnerability scan results
   */
  async analyzeVulnerabilities(context: {
    scan_date: string;
    vulnerabilities: Array<{
      cve_id: string;
      severity: 'critical' | 'high' | 'medium' | 'low';
      cvss_score: number;
      affected_component: string;
      description: string;
      exploit_available: boolean;
    }>;
    environment: 'production' | 'staging' | 'development';
  }): Promise<string> {
    const criticalCount = context.vulnerabilities.filter(v => v.severity === 'critical').length;
    const highCount = context.vulnerabilities.filter(v => v.severity === 'high').length;
    
    const task = `Analyze vulnerability scan results from ${context.scan_date}.

Environment: ${context.environment}
Total Vulnerabilities: ${context.vulnerabilities.length}
- Critical: ${criticalCount}
- High: ${highCount}
- Medium: ${context.vulnerabilities.filter(v => v.severity === 'medium').length}
- Low: ${context.vulnerabilities.filter(v => v.severity === 'low').length}

Top Vulnerabilities:
${context.vulnerabilities
  .sort((a, b) => b.cvss_score - a.cvss_score)
  .slice(0, 10)
  .map(v => 
    `- ${v.cve_id} (${v.severity.toUpperCase()}, CVSS: ${v.cvss_score})
  Component: ${v.affected_component}
  ${v.description}
  ${v.exploit_available ? '⚠️ Exploit Available' : ''}`
  ).join('\n\n')}

Provide:
1. Executive summary of security posture
2. Critical vulnerabilities requiring immediate action
3. Exploitability assessment
4. Remediation recommendations with priority
5. Compensating controls for delayed fixes
6. Patch management strategy
7. Expected remediation timeline
8. Risk acceptance recommendations (if applicable)`;

    const result = await this.executeTask(task, {
      entity_type: 'vulnerability_analysis',
    });
    
    return result.response;
  }
  
  /**
   * Design incident response plan
   */
  async designIncidentResponse(context: {
    organization_size: string;
    critical_systems: string[];
    compliance_requirements: string[];
    current_capabilities?: string[];
  }): Promise<string> {
    const task = `Design incident response plan for ${context.organization_size} organization.

Critical Systems: ${context.critical_systems.join(', ')}
Compliance: ${context.compliance_requirements.join(', ')}
${context.current_capabilities ? `Current Capabilities: ${context.current_capabilities.join(', ')}` : ''}

Provide:
1. Incident response framework (NIST, SANS)
2. Incident classification and severity levels
3. Response team roles and responsibilities
4. Detection and alerting mechanisms
5. Containment and eradication procedures
6. Communication and escalation protocols
7. Forensics and evidence collection procedures
8. Post-incident review and lessons learned process
9. Tabletop exercise scenarios`;

    const result = await this.executeTask(task, {
      entity_type: 'incident_response_plan',
    });
    
    return result.response;
  }
  
  /**
   * Assess compliance readiness
   */
  async assessCompliance(context: {
    framework: 'SOC2' | 'ISO27001' | 'GDPR' | 'HIPAA' | 'PCI-DSS';
    current_controls: Array<{
      control_id: string;
      description: string;
      implementation_status: 'implemented' | 'partial' | 'not_implemented';
      evidence?: string;
    }>;
    target_date: string;
  }): Promise<string> {
    const implemented = context.current_controls.filter(c => c.implementation_status === 'implemented').length;
    const partial = context.current_controls.filter(c => c.implementation_status === 'partial').length;
    const notImplemented = context.current_controls.filter(c => c.implementation_status === 'not_implemented').length;
    
    const task = `Assess ${context.framework} compliance readiness.

Target Compliance Date: ${context.target_date}

Control Implementation Status:
- Implemented: ${implemented}
- Partially Implemented: ${partial}
- Not Implemented: ${notImplemented}

Sample Controls:
${context.current_controls.slice(0, 10).map(c => 
  `- ${c.control_id}: ${c.description}
  Status: ${c.implementation_status}
  ${c.evidence ? `Evidence: ${c.evidence}` : ''}`
).join('\n\n')}

Provide:
1. Compliance readiness assessment (percentage complete)
2. Gap analysis by control domain
3. Critical gaps requiring immediate attention
4. Evidence collection requirements
5. Policy and procedure development needs
6. Technical control implementation roadmap
7. Audit preparation checklist
8. Timeline to achieve compliance`;

    const result = await this.executeTask(task, {
      entity_type: 'compliance_assessment',
    });
    
    return result.response;
  }
}
