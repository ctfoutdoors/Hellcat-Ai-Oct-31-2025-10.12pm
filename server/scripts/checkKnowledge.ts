import { getDb } from '../db';

async function checkKnowledge() {
  const db = await getDb();
  if (!db) {
    console.log('❌ Database not available');
    return;
  }

  const [sharedKnowledge] = await db.execute('SELECT COUNT(*) as count FROM ai_shared_knowledge');
  const [agents] = await db.execute('SELECT COUNT(*) as count FROM ai_agents');
  
  console.log('📊 Database Status:');
  console.log(`   - AI Agents: ${(sharedKnowledge as any)[0].count}`);
  console.log(`   - Shared Knowledge: ${(agents as any)[0].count}`);
  
  if ((sharedKnowledge as any)[0].count > 0) {
    const [insights] = await db.execute('SELECT id, agentId, topic, department, createdAt FROM ai_shared_knowledge ORDER BY createdAt DESC LIMIT 10');
    console.log('\n📝 Recent Insights:');
    (insights as any[]).forEach((insight: any, i: number) => {
      console.log(`   ${i + 1}. ${insight.topic} (${insight.department}) - Agent ${insight.agentId}`);
    });
  }
}

checkKnowledge().then(() => process.exit(0)).catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
