import { BaseAgent } from '../BaseAgent';
import type { AIAgent } from '../../../../drizzle/schema';

/**
 * Content Marketing Agent
 * 
 * Reports to: CMO
 * Department: Marketing
 * 
 * Expertise:
 * - Content strategy and planning
 * - Content creation and optimization
 * - Content distribution and promotion
 * - Editorial calendar management
 * - Content performance analytics
 * - SEO content optimization
 */
export class ContentMarketingAgent extends BaseAgent {
  constructor(agentData: AIAgent) {
    super(agentData);
  }
  
  /**
   * Get specialized system prompt for Content Marketing
   */
  protected getSpecializedPrompt(): string {
    return `You are a Content Marketing Specialist with PhD-level expertise in content strategy, creation, and distribution.

**CORE COMPETENCIES:**

1. **Content Strategy**
   - Content marketing frameworks (Hub & Spoke, Pillar-Cluster)
   - Audience segmentation and persona development
   - Content funnel mapping (TOFU, MOFU, BOFU)
   - Competitive content analysis
   - Content gap identification
   - Topic clustering and keyword research

2. **Content Creation**
   - Copywriting best practices (AIDA, PAS, FAB)
   - Storytelling techniques and narrative structures
   - Brand voice and tone guidelines
   - Content formats (blog posts, whitepapers, case studies, infographics)
   - Multimedia content (video scripts, podcasts, webinars)
   - User-generated content strategies

3. **Content Optimization**
   - SEO content optimization (on-page, semantic SEO)
   - Readability and engagement optimization
   - A/B testing and experimentation
   - Content refresh and repurposing strategies
   - Conversion rate optimization (CRO)
   - Accessibility and inclusive content

4. **Content Distribution**
   - Multi-channel distribution strategies
   - Content syndication and partnerships
   - Social media amplification
   - Email marketing integration
   - Paid content promotion (native ads, sponsored content)
   - Influencer collaboration

5. **Content Analytics**
   - Content performance metrics (traffic, engagement, conversions)
   - Attribution modeling and ROI analysis
   - Content scoring and prioritization
   - Audience behavior analysis
   - Competitive benchmarking
   - Predictive content analytics

**ANALYTICAL FRAMEWORKS:**

- **Content Audit**: Comprehensive inventory and performance analysis
- **Topic Authority Matrix**: Topic coverage vs. search visibility mapping
- **Content ROI Model**: Revenue attribution and cost-per-acquisition analysis
- **Engagement Scoring**: Multi-dimensional content engagement metrics
- **Content Lifecycle**: Creation, optimization, promotion, refresh cycle

**DELIVERABLES:**

- Content strategy documents with audience insights
- Editorial calendars with topic clusters
- Content briefs with SEO guidelines
- Performance reports with actionable recommendations
- Content optimization recommendations
- Distribution plans with channel strategies

**COMMUNICATION STANDARDS:**

- Cite content marketing research and industry benchmarks
- Provide data-driven recommendations with expected outcomes
- Reference successful case studies and best practices
- Quantify content performance and ROI
- Flag content opportunities and risks
- Recommend specific tools and technologies

Always deliver strategic, data-driven content recommendations that drive measurable business results.`;
  }
  
  /**
   * Develop content strategy
   */
  async developContentStrategy(context: {
    business_goals: string[];
    target_audience: Array<{
      persona: string;
      pain_points: string[];
      content_preferences: string[];
    }>;
    competitors: string[];
    current_performance?: Record<string, number>;
  }): Promise<string> {
    const task = `Develop comprehensive content marketing strategy.

Business Goals:
${context.business_goals.map(g => `- ${g}`).join('\n')}

Target Audience (${context.target_audience.length} personas):
${context.target_audience.map(p => 
  `- ${p.persona}
  Pain Points: ${p.pain_points.join(', ')}
  Content Preferences: ${p.content_preferences.join(', ')}`
).join('\n\n')}

Competitors: ${context.competitors.join(', ')}

${context.current_performance ? `Current Performance:\n${Object.entries(context.current_performance).map(([k, v]) => `- ${k}: ${v}`).join('\n')}` : ''}

Provide:
1. Content marketing objectives aligned with business goals
2. Audience-specific content strategies
3. Content pillar and topic cluster recommendations
4. Content format mix and distribution channels
5. Competitive differentiation strategies
6. Success metrics and KPIs
7. 90-day implementation roadmap`;

    const result = await this.executeTask(task, {
      entity_type: 'content_strategy',
    });
    
    return result.response;
  }
  
  /**
   * Create editorial calendar
   */
  async createEditorialCalendar(context: {
    timeframe: string;
    content_pillars: string[];
    publishing_frequency: string;
    channels: string[];
    seasonal_events?: Array<{ date: string; event: string }>;
  }): Promise<string> {
    const task = `Create editorial calendar for ${context.timeframe}.

Content Pillars: ${context.content_pillars.join(', ')}
Publishing Frequency: ${context.publishing_frequency}
Distribution Channels: ${context.channels.join(', ')}

${context.seasonal_events ? `Seasonal Events:\n${context.seasonal_events.map(e => `- ${e.date}: ${e.event}`).join('\n')}` : ''}

Provide:
1. Week-by-week content calendar
2. Topic assignments by content pillar
3. Content format recommendations per topic
4. Channel-specific distribution schedule
5. Keyword targeting for each piece
6. Resource requirements and timelines
7. Seasonal content opportunities`;

    const result = await this.executeTask(task, {
      entity_type: 'editorial_calendar',
    });
    
    return result.response;
  }
  
  /**
   * Optimize content performance
   */
  async optimizeContent(context: {
    content_url: string;
    current_metrics: {
      traffic: number;
      engagement_rate: number;
      conversion_rate: number;
      avg_time_on_page: number;
      bounce_rate: number;
    };
    target_keywords?: string[];
    competitors_ranking?: string[];
  }): Promise<string> {
    const task = `Optimize content performance for: ${context.content_url}

Current Metrics:
- Traffic: ${context.current_metrics.traffic} visits
- Engagement Rate: ${context.current_metrics.engagement_rate}%
- Conversion Rate: ${context.current_metrics.conversion_rate}%
- Avg Time on Page: ${context.current_metrics.avg_time_on_page}s
- Bounce Rate: ${context.current_metrics.bounce_rate}%

${context.target_keywords ? `Target Keywords: ${context.target_keywords.join(', ')}` : ''}
${context.competitors_ranking ? `Competitors Ranking: ${context.competitors_ranking.join(', ')}` : ''}

Provide:
1. Content performance diagnosis
2. SEO optimization recommendations (title, headers, meta, keywords)
3. Readability and engagement improvements
4. CTA and conversion optimization
5. Internal linking opportunities
6. Content refresh vs. rewrite recommendation
7. Expected performance improvement (quantified)`;

    const result = await this.executeTask(task, {
      entity_type: 'content_optimization',
    });
    
    return result.response;
  }
  
  /**
   * Analyze content performance
   */
  async analyzePerformance(context: {
    period: string;
    content_pieces: Array<{
      title: string;
      url: string;
      publish_date: string;
      traffic: number;
      conversions: number;
      engagement_score: number;
    }>;
    goals: Record<string, number>;
  }): Promise<string> {
    const totalTraffic = context.content_pieces.reduce((sum, c) => sum + c.traffic, 0);
    const totalConversions = context.content_pieces.reduce((sum, c) => sum + c.conversions, 0);
    
    const task = `Analyze content performance for period ${context.period}.

Content Portfolio (${context.content_pieces.length} pieces):
Total Traffic: ${totalTraffic.toLocaleString()}
Total Conversions: ${totalConversions}

Top Performers:
${context.content_pieces
  .sort((a, b) => b.traffic - a.traffic)
  .slice(0, 5)
  .map(c => `- ${c.title}: ${c.traffic.toLocaleString()} visits, ${c.conversions} conversions, Engagement: ${c.engagement_score}`)
  .join('\n')}

Goals:
${Object.entries(context.goals).map(([metric, target]) => `- ${metric}: ${target}`).join('\n')}

Provide:
1. Overall content performance summary
2. Goal achievement analysis
3. Top performing content themes and formats
4. Underperforming content diagnosis
5. Content ROI analysis
6. Audience insights and behavior patterns
7. Strategic recommendations for next period`;

    const result = await this.executeTask(task, {
      entity_type: 'content_performance',
      entity_id: context.period,
    });
    
    return result.response;
  }
  
  /**
   * Conduct content audit
   */
  async conductContentAudit(context: {
    domain: string;
    content_inventory: Array<{
      url: string;
      title: string;
      word_count: number;
      publish_date: string;
      last_updated?: string;
      traffic_30d: number;
      backlinks: number;
    }>;
    audit_criteria: string[];
  }): Promise<string> {
    const task = `Conduct comprehensive content audit for ${context.domain}.

Content Inventory: ${context.content_inventory.length} pieces

Sample Content:
${context.content_inventory.slice(0, 10).map(c => 
  `- ${c.title} (${c.word_count} words)
  Published: ${c.publish_date} | Traffic (30d): ${c.traffic_30d} | Backlinks: ${c.backlinks}`
).join('\n\n')}

Audit Criteria: ${context.audit_criteria.join(', ')}

Provide:
1. Content inventory analysis (volume, freshness, quality)
2. Content performance distribution (high/medium/low performers)
3. Content gaps and opportunities
4. Duplicate and cannibalization issues
5. Technical SEO issues (broken links, thin content, etc.)
6. Content refresh priorities (top 20 pieces)
7. Content deletion recommendations
8. Strategic content roadmap`;

    const result = await this.executeTask(task, {
      entity_type: 'content_audit',
    });
    
    return result.response;
  }
}
