import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function migrate() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    console.log('🚀 Starting AI System migration...\n');
    
    // Create ai_agents table
    console.log('Creating ai_agents table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ai_agents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role ENUM(
          'ceo', 'cfo', 'cgo', 'cmo', 'cto', 'coo', 'chro', 'cxo',
          'chief_intelligence_officer', 'clo', 'cdo', 'cso',
          'vp_sales', 'vp_product', 'vp_engineering', 'vp_customer_success',
          'vp_business_development', 'vp_supply_chain',
          'financial_analyst', 'tax_specialist', 'accountant', 'budget_analyst',
          'market_researcher', 'partnership_developer', 'growth_analyst',
          'seo_specialist', 'social_media_manager', 'content_writer', 'email_marketer',
          'backend_developer', 'frontend_developer', 'devops_engineer', 'qa_engineer',
          'product_manager', 'ux_designer', 'data_scientist',
          'recruiter', 'hr_specialist', 'training_coordinator',
          'customer_success_manager', 'support_agent', 'community_manager',
          'legal_counsel', 'compliance_officer', 'contract_specialist',
          'security_analyst', 'penetration_tester', 'incident_responder',
          'sales_rep', 'account_executive', 'sales_engineer',
          'personal_assistant', 'personal_life_manager', 'family_manager',
          'specialist', 'analyst', 'coordinator', 'manager'
        ) NOT NULL,
        name VARCHAR(200) NOT NULL,
        department VARCHAR(100),
        team VARCHAR(100),
        parentAgentId INT,
        level INT DEFAULT 0 NOT NULL,
        capabilities JSON NOT NULL,
        modelConfig JSON NOT NULL,
        status ENUM('active', 'idle', 'working', 'learning', 'error', 'offline') DEFAULT 'idle' NOT NULL,
        currentTask TEXT,
        lastActiveAt TIMESTAMP NULL,
        tasksCompleted INT DEFAULT 0 NOT NULL,
        avgResponseTime INT,
        successRate INT DEFAULT 100,
        totalCost DECIMAL(10, 2) DEFAULT 0.00,
        accessLevel INT DEFAULT 2 NOT NULL,
        canAccessPersonalData BOOLEAN DEFAULT FALSE NOT NULL,
        isActive BOOLEAN DEFAULT TRUE NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        INDEX role_idx (role),
        INDEX parent_idx (parentAgentId),
        INDEX status_idx (status),
        INDEX department_idx (department)
      )
    `);
    console.log('✅ ai_agents table created\n');
    
    // Create ai_agent_teams table
    console.log('Creating ai_agent_teams table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ai_agent_teams (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        purpose TEXT NOT NULL,
        leaderAgentId INT NOT NULL,
        memberAgentIds JSON NOT NULL,
        status ENUM('active', 'completed', 'on_hold', 'cancelled') DEFAULT 'active' NOT NULL,
        startDate TIMESTAMP NOT NULL,
        endDate TIMESTAMP NULL,
        initiative VARCHAR(200),
        priority ENUM('urgent', 'high', 'normal', 'low') DEFAULT 'normal' NOT NULL,
        tasksCompleted INT DEFAULT 0 NOT NULL,
        tasksInProgress INT DEFAULT 0 NOT NULL,
        createdBy INT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        INDEX leader_idx (leaderAgentId),
        INDEX status_idx (status),
        INDEX priority_idx (priority)
      )
    `);
    console.log('✅ ai_agent_teams table created\n');
    
    // Create ai_agent_tasks table
    console.log('Creating ai_agent_tasks table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ai_agent_tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT NOT NULL,
        taskType VARCHAR(100) NOT NULL,
        assignedToAgentId INT NOT NULL,
        assignedByAgentId INT,
        teamId INT,
        context JSON,
        status ENUM('pending', 'in_progress', 'completed', 'failed', 'cancelled') DEFAULT 'pending' NOT NULL,
        priority ENUM('urgent', 'high', 'normal', 'low') DEFAULT 'normal' NOT NULL,
        dueDate TIMESTAMP NULL,
        startedAt TIMESTAMP NULL,
        completedAt TIMESTAMP NULL,
        result JSON,
        executionTime INT,
        cost DECIMAL(10, 4),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        INDEX assigned_to_idx (assignedToAgentId),
        INDEX status_idx (status),
        INDEX priority_idx (priority),
        INDEX team_idx (teamId),
        INDEX due_date_idx (dueDate)
      )
    `);
    console.log('✅ ai_agent_tasks table created\n');
    
    // Create ai_agent_conversations table
    console.log('Creating ai_agent_conversations table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ai_agent_conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        participantAgentIds JSON NOT NULL,
        userId INT,
        conversationType ENUM('user_command', 'agent_collaboration', 'escalation', 'delegation', 'learning') NOT NULL,
        messages JSON NOT NULL,
        relatedTaskId INT,
        relatedTeamId INT,
        status ENUM('active', 'completed', 'archived') DEFAULT 'active' NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        INDEX user_idx (userId),
        INDEX type_idx (conversationType),
        INDEX status_idx (status),
        INDEX task_idx (relatedTaskId)
      )
    `);
    console.log('✅ ai_agent_conversations table created\n');
    
    // Create ai_learning_data table
    console.log('Creating ai_learning_data table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ai_learning_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sourceType ENUM('case_outcome', 'template_performance', 'user_feedback', 'agent_decision', 'market_data') NOT NULL,
        sourceId INT NOT NULL,
        context JSON NOT NULL,
        outcome JSON NOT NULL,
        learnings JSON,
        appliedToAgents JSON,
        improvedMetrics JSON,
        collectedBy INT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        INDEX source_idx (sourceType, sourceId),
        INDEX collected_by_idx (collectedBy)
      )
    `);
    console.log('✅ ai_learning_data table created\n');
    
    // Create ai_fine_tuned_models table
    console.log('Creating ai_fine_tuned_models table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ai_fine_tuned_models (
        id INT AUTO_INCREMENT PRIMARY KEY,
        openaiModelId VARCHAR(200) NOT NULL UNIQUE,
        basedOn VARCHAR(100) NOT NULL,
        purpose VARCHAR(500) NOT NULL,
        trainingDataSize INT NOT NULL,
        trainingCost DECIMAL(10, 2),
        trainingStartedAt TIMESTAMP NULL,
        trainingCompletedAt TIMESTAMP NULL,
        validationAccuracy DECIMAL(5, 2),
        productionUsageCount INT DEFAULT 0 NOT NULL,
        avgPerformanceImprovement DECIMAL(5, 2),
        assignedToAgents JSON,
        status ENUM('training', 'validating', 'active', 'deprecated', 'failed') DEFAULT 'training' NOT NULL,
        createdBy INT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        INDEX status_idx (status),
        INDEX purpose_idx (purpose)
      )
    `);
    console.log('✅ ai_fine_tuned_models table created\n');
    
    console.log('🎉 AI System migration completed successfully!');
    console.log('\nCreated tables:');
    console.log('  - ai_agents');
    console.log('  - ai_agent_teams');
    console.log('  - ai_agent_tasks');
    console.log('  - ai_agent_conversations');
    console.log('  - ai_learning_data');
    console.log('  - ai_fine_tuned_models');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

migrate().catch(console.error);
