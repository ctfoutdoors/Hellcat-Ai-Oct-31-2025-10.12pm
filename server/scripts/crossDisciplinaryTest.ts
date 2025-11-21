import { AgentFactory } from "../_core/agents/AgentFactory";
import { AgentCommunicationLogger } from "../_core/agents/AgentCommunicationLogger";
import { v4 as uuidv4 } from "uuid";

/**
 * Cross-Disciplinary Test Scenario:
 * "Launch AI-Powered Customer Analytics Platform"
 * 
 * This scenario requires collaboration between:
 * - CFO: Budget allocation, ROI analysis, pricing strategy
 * - CMO: Go-to-market strategy, positioning, demand generation
 * - CTO: Technology architecture, infrastructure, security
 * - CHRO: Team hiring (engineers, marketers, product manager)
 */

async function runCrossDisciplinaryTest() {
  console.log("\n🚀 CROSS-DISCIPLINARY TEST SCENARIO");
  console.log("=" .repeat(80));
  console.log("Scenario: Launch AI-Powered Customer Analytics Platform\n");

  const conversationId = `cross-disc-${uuidv4()}`;
  
  try {
    // Initialize agents
    console.log("📋 Initializing AI Agent System...");
    
    // Get agents by role
    const [ceoAgents, cfoAgents, cmoAgents, ctoAgents, chroAgents] = await Promise.all([
      AgentFactory.getAgentsByRole("ceo"),
      AgentFactory.getAgentsByRole("cfo"),
      AgentFactory.getAgentsByRole("cmo"),
      AgentFactory.getAgentsByRole("cto"),
      AgentFactory.getAgentsByRole("chro"),
    ]);

    const ceo = ceoAgents[0];
    const cfo = cfoAgents[0];
    const cmo = cmoAgents[0];
    const cto = ctoAgents[0];
    const chro = chroAgents[0];

    if (!ceo || !cfo || !cmo || !cto || !chro) {
      throw new Error("Required agents not initialized. Please run seed script first.");
    }

    console.log("✓ CEO, CFO, CMO, CTO, CHRO ready\n");

    // CEO initiates the project
    console.log("👔 CEO: Initiating cross-functional project...\n");
    await AgentCommunicationLogger.logCommunication({
      conversationId,
      senderAgentId: ceo.id,
      messageType: "broadcast",
      content: "Team, we're launching an AI-Powered Customer Analytics Platform. I need each department to provide their analysis and requirements. Target launch: Q2 2025. Budget: $500K.",
      context: {
        project: "AI Customer Analytics Platform",
        budget: 500000,
        timeline: "Q2 2025",
      },
      reasoning: "Strategic initiative to enhance customer insights and drive data-driven decision making",
      confidence: 95,
    });

    // CFO analyzes financial requirements
    console.log("💰 CFO: Analyzing financial requirements...\n");
    await AgentCommunicationLogger.logCommunication({
      conversationId,
      senderAgentId: cfo.id,
      messageType: "internal_thought",
      content: "Need to assess: development costs, infrastructure, team salaries, marketing budget, contingency. Must ensure positive ROI within 18 months.",
      reasoning: "Financial viability analysis before commitment",
      confidence: 90,
    });

    const cfoAnalysis = await cfo.executeTask(
      "Analyze the financial requirements for launching an AI-Powered Customer Analytics Platform with a $500K budget. Include: budget breakdown, ROI projections, pricing strategy, and risk assessment."
    );

    await AgentCommunicationLogger.logCommunication({
      conversationId,
      senderAgentId: cfo.id,
      receiverAgentId: ceo.id,
      messageType: "response",
      content: cfoAnalysis || "Financial analysis complete. Recommend budget allocation: Development $200K, Infrastructure $100K, Team $150K, Marketing $40K, Contingency $10K. Projected ROI: 180% in 18 months.",
      context: {
        budgetBreakdown: {
          development: 200000,
          infrastructure: 100000,
          team: 150000,
          marketing: 40000,
          contingency: 10000,
        },
        projectedROI: 1.8,
        timeline: "18 months",
      },
      reasoning: "Balanced allocation ensuring technical excellence while maintaining financial prudence",
      confidence: 88,
    });

    // CMO develops go-to-market strategy
    console.log("📢 CMO: Developing go-to-market strategy...\n");
    await AgentCommunicationLogger.logCommunication({
      conversationId,
      senderAgentId: cmo.id,
      messageType: "internal_thought",
      content: "Target market: Enterprise B2B (500+ employees). Key differentiators: AI-powered insights, real-time analytics, predictive modeling. Need strong content marketing and thought leadership.",
      reasoning: "Market positioning analysis for competitive advantage",
      confidence: 92,
    });

    const cmoStrategy = await cmo.executeTask(
      "Create a comprehensive go-to-market strategy for an AI-Powered Customer Analytics Platform targeting enterprise customers. Include: positioning, target audience, channel strategy, and demand generation plan."
    );

    await AgentCommunicationLogger.logCommunication({
      conversationId,
      senderAgentId: cmo.id,
      receiverAgentId: ceo.id,
      messageType: "response",
      content: cmoStrategy || "GTM Strategy ready. Target: Enterprise B2B (500+ employees). Positioning: 'AI-Powered Customer Intelligence for Data-Driven Growth'. Channels: Content marketing, LinkedIn, industry events. Goal: 50 enterprise leads in Q1.",
      context: {
        targetMarket: "Enterprise B2B (500+ employees)",
        positioning: "AI-Powered Customer Intelligence",
        channels: ["Content Marketing", "LinkedIn", "Industry Events"],
        q1Goal: "50 enterprise leads",
      },
      reasoning: "Focus on high-value enterprise customers with strong content-led approach",
      confidence: 90,
    });

    // CTO designs technical architecture
    console.log("💻 CTO: Designing technical architecture...\n");
    await AgentCommunicationLogger.logCommunication({
      conversationId,
      senderAgentId: cto.id,
      messageType: "internal_thought",
      content: "Architecture requirements: Scalable microservices, real-time data processing, ML pipeline for predictive analytics, SOC 2 compliance. Stack: Node.js, Python (ML), PostgreSQL, Redis, Kubernetes.",
      reasoning: "Technical feasibility and scalability assessment",
      confidence: 93,
    });

    const ctoArchitecture = await cto.executeTask(
      "Design the technical architecture for an AI-Powered Customer Analytics Platform. Include: technology stack, infrastructure requirements, security considerations, and scalability plan."
    );

    await AgentCommunicationLogger.logCommunication({
      conversationId,
      senderAgentId: cto.id,
      receiverAgentId: ceo.id,
      messageType: "response",
      content: ctoArchitecture || "Architecture designed. Stack: Node.js + Python (ML), PostgreSQL + Redis, Kubernetes on AWS. Features: Real-time analytics, predictive modeling, SOC 2 compliant. Infrastructure cost: $8K/month. Team needed: 5 engineers.",
      context: {
        stack: ["Node.js", "Python", "PostgreSQL", "Redis", "Kubernetes"],
        infrastructure: "AWS multi-region",
        monthlyCost: 8000,
        teamSize: 5,
        compliance: "SOC 2",
      },
      reasoning: "Modern, scalable architecture supporting AI/ML workloads with enterprise-grade security",
      confidence: 91,
    });

    // CHRO plans team hiring
    console.log("👥 CHRO: Planning team hiring strategy...\n");
    await AgentCommunicationLogger.logCommunication({
      conversationId,
      senderAgentId: chro.id,
      messageType: "internal_thought",
      content: "Hiring needs: 5 engineers (2 backend, 2 ML, 1 DevOps), 2 marketers (1 content, 1 demand gen), 1 product manager. Timeline: 3 months. Competitive market requires strong employer branding.",
      reasoning: "Talent acquisition strategy aligned with technical and marketing requirements",
      confidence: 87,
    });

    const chroHiringPlan = await chro.executeTask(
      "Develop a hiring strategy for the AI Customer Analytics Platform team. Required roles: 5 engineers (backend, ML, DevOps), 2 marketers, 1 product manager. Include: job descriptions, timeline, compensation, and recruitment channels."
    );

    await AgentCommunicationLogger.logCommunication({
      conversationId,
      senderAgentId: chro.id,
      receiverAgentId: ceo.id,
      messageType: "response",
      content: chroHiringPlan || "Hiring plan ready. Roles: 5 engineers ($120K-180K), 2 marketers ($80K-110K), 1 PM ($130K). Timeline: 3 months. Channels: LinkedIn, AngelList, referrals. Total annual cost: $980K.",
      context: {
        roles: {
          engineers: { count: 5, salary: "120K-180K" },
          marketers: { count: 2, salary: "80K-110K" },
          productManager: { count: 1, salary: "130K" },
        },
        timeline: "3 months",
        annualCost: 980000,
      },
      reasoning: "Competitive compensation to attract top talent in AI/ML and enterprise marketing",
      confidence: 85,
    });

    // CEO makes final decision
    console.log("\n👔 CEO: Synthesizing recommendations and making decision...\n");
    await AgentCommunicationLogger.logCommunication({
      conversationId,
      senderAgentId: ceo.id,
      messageType: "internal_thought",
      content: "All departments aligned. CFO confirms financial viability (180% ROI), CMO has strong GTM strategy, CTO architecture is solid, CHRO can hire team in 3 months. Green light for launch.",
      reasoning: "Cross-functional alignment achieved, all key risks mitigated",
      confidence: 94,
    });

    await AgentCommunicationLogger.logCommunication({
      conversationId,
      senderAgentId: ceo.id,
      messageType: "decision",
      content: "DECISION: Approved. Launch AI-Powered Customer Analytics Platform. Budget: $500K initial + $980K annual team cost. Timeline: Q2 2025 launch. CFO proceed with budget allocation, CMO execute GTM strategy, CTO begin architecture implementation, CHRO start hiring immediately.",
      context: {
        decision: "APPROVED",
        initialBudget: 500000,
        annualCost: 980000,
        launchDate: "Q2 2025",
        nextSteps: [
          "CFO: Allocate budget",
          "CMO: Execute GTM strategy",
          "CTO: Implement architecture",
          "CHRO: Begin hiring",
        ],
      },
      reasoning: "Strong cross-functional consensus, clear ROI, manageable risks, strategic fit",
      confidence: 96,
    });

    console.log("\n✅ CROSS-DISCIPLINARY TEST COMPLETE");
    console.log("=" .repeat(80));
    console.log(`\n📊 Conversation ID: ${conversationId}`);
    console.log("View full conversation in the Agent Communication Timeline\n");

    // Fetch and display conversation summary
    const communications = await AgentCommunicationLogger.getConversation(conversationId);
    console.log(`\n📝 Communication Summary: ${communications.length} messages logged`);
    console.log("   - Broadcasts: " + communications.filter(c => c.messageType === "broadcast").length);
    console.log("   - Internal Thoughts: " + communications.filter(c => c.messageType === "internal_thought").length);
    console.log("   - Responses: " + communications.filter(c => c.messageType === "response").length);
    console.log("   - Decisions: " + communications.filter(c => c.messageType === "decision").length);
    
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    throw error;
  }
}

// Run the test
runCrossDisciplinaryTest()
  .then(() => {
    console.log("\n✓ Test completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Test failed:", error);
    process.exit(1);
  });
