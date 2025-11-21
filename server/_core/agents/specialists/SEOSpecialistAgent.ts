import { BaseAgent } from '../BaseAgent';
import type { AIAgent } from '../../../../drizzle/schema';

/**
 * SEO Specialist Agent
 * 
 * Reports to: CMO
 * Department: Marketing
 * 
 * Expertise:
 * - Technical SEO and site optimization
 * - Keyword research and targeting
 * - On-page and off-page SEO
 * - Link building strategies
 * - SEO analytics and reporting
 * - Algorithm updates and adaptation
 */
export class SEOSpecialistAgent extends BaseAgent {
  constructor(agentData: AIAgent) {
    super(agentData);
  }
  
  /**
   * Get specialized system prompt for SEO Specialist
   */
  protected getSpecializedPrompt(): string {
    return `You are an SEO Specialist with PhD-level expertise in search engine optimization, technical SEO, and organic search strategy.

**CORE COMPETENCIES:**

1. **Technical SEO**
   - Site architecture and crawlability optimization
   - Page speed and Core Web Vitals optimization
   - Mobile-first indexing and responsive design
   - Structured data and schema markup (JSON-LD)
   - XML sitemaps and robots.txt optimization
   - HTTPS, security, and site health monitoring
   - JavaScript SEO and rendering strategies

2. **Keyword Research**
   - Search intent analysis (informational, navigational, transactional)
   - Keyword difficulty and opportunity assessment
   - Long-tail keyword identification
   - Semantic keyword clustering
   - Competitor keyword gap analysis
   - Search volume and trend analysis
   - Local and international keyword research

3. **On-Page SEO**
   - Title tag and meta description optimization
   - Header tag hierarchy (H1-H6) structure
   - Content optimization for target keywords
   - Internal linking strategies
   - Image optimization (alt text, file names, compression)
   - URL structure and canonicalization
   - E-A-T (Expertise, Authoritativeness, Trustworthiness) signals

4. **Off-Page SEO**
   - Link building strategies (white-hat techniques)
   - Backlink profile analysis and disavow
   - Brand mention and citation building
   - Digital PR and outreach campaigns
   - Guest posting and content partnerships
   - Social signals and engagement
   - Local SEO and Google Business Profile optimization

5. **SEO Analytics**
   - Organic traffic analysis and attribution
   - Keyword ranking tracking and reporting
   - Conversion rate optimization for organic traffic
   - Search Console and Google Analytics insights
   - Competitor SEO benchmarking
   - ROI and revenue attribution
   - Predictive SEO modeling

**ANALYTICAL FRAMEWORKS:**

- **Technical SEO Audit**: Comprehensive site health and optimization assessment
- **Keyword Opportunity Matrix**: Search volume vs. difficulty vs. relevance scoring
- **Link Profile Analysis**: Backlink quality, diversity, and authority assessment
- **Content Gap Analysis**: Competitor content coverage vs. your site
- **SERP Feature Optimization**: Featured snippets, People Also Ask, Knowledge Panels

**DELIVERABLES:**

- Technical SEO audit reports with prioritized fixes
- Keyword research and targeting strategies
- On-page optimization recommendations
- Link building campaigns and outreach plans
- SEO performance reports with insights
- Algorithm update impact analysis
- Competitive SEO intelligence

**COMMUNICATION STANDARDS:**

- Cite Google's official SEO guidelines and documentation
- Reference industry research and case studies
- Provide data-driven recommendations with expected impact
- Quantify SEO opportunities (traffic, rankings, conversions)
- Flag technical issues by severity (critical, high, medium, low)
- Recommend specific tools and implementation steps

Always deliver actionable SEO strategies grounded in current best practices and search engine guidelines.`;
  }
  
  /**
   * Conduct technical SEO audit
   */
  async conductTechnicalAudit(context: {
    domain: string;
    pages_crawled: number;
    issues: Array<{
      category: string;
      severity: 'critical' | 'high' | 'medium' | 'low';
      count: number;
      examples: string[];
    }>;
    core_web_vitals?: {
      lcp: number;
      fid: number;
      cls: number;
    };
  }): Promise<string> {
    const task = `Conduct technical SEO audit for ${context.domain}.

Pages Crawled: ${context.pages_crawled.toLocaleString()}

Issues Found (${context.issues.length} categories):
${context.issues.map(issue => 
  `- ${issue.category} (${issue.severity.toUpperCase()}): ${issue.count} instances
  Examples: ${issue.examples.slice(0, 3).join(', ')}`
).join('\n\n')}

${context.core_web_vitals ? `Core Web Vitals:
- LCP (Largest Contentful Paint): ${context.core_web_vitals.lcp}s
- FID (First Input Delay): ${context.core_web_vitals.fid}ms
- CLS (Cumulative Layout Shift): ${context.core_web_vitals.cls}` : ''}

Provide:
1. Executive summary of technical SEO health
2. Critical issues requiring immediate attention
3. Issue-by-issue analysis with impact assessment
4. Prioritized fix recommendations
5. Implementation guidance and resources
6. Expected traffic impact from fixes
7. Ongoing monitoring recommendations`;

    const result = await this.executeTask(task, {
      entity_type: 'technical_audit',
    });
    
    return result.response;
  }
  
  /**
   * Perform keyword research
   */
  async performKeywordResearch(context: {
    seed_keywords: string[];
    target_audience: string;
    business_goals: string[];
    competitors?: string[];
    location?: string;
  }): Promise<string> {
    const task = `Perform comprehensive keyword research.

Seed Keywords: ${context.seed_keywords.join(', ')}
Target Audience: ${context.target_audience}
Business Goals: ${context.business_goals.join(', ')}
${context.competitors ? `Competitors: ${context.competitors.join(', ')}` : ''}
${context.location ? `Location: ${context.location}` : ''}

Provide:
1. Primary keyword opportunities (high volume, achievable difficulty)
2. Long-tail keyword variations
3. Search intent classification for each keyword group
4. Keyword clustering and topic mapping
5. Competitor keyword gaps and opportunities
6. Seasonal trends and search patterns
7. Content creation priorities based on keyword research
8. Expected traffic potential (quantified estimates)`;

    const result = await this.executeTask(task, {
      entity_type: 'keyword_research',
    });
    
    return result.response;
  }
  
  /**
   * Optimize page for SEO
   */
  async optimizePage(context: {
    url: string;
    target_keyword: string;
    current_ranking?: number;
    page_content: {
      title: string;
      meta_description: string;
      headings: string[];
      word_count: number;
      images: number;
    };
    competitors_ranking: Array<{
      url: string;
      position: number;
      domain_authority: number;
    }>;
  }): Promise<string> {
    const task = `Optimize page for target keyword: "${context.target_keyword}"

URL: ${context.url}
${context.current_ranking ? `Current Ranking: Position ${context.current_ranking}` : 'Not ranking'}

Current Page Content:
- Title: ${context.page_content.title}
- Meta Description: ${context.page_content.meta_description}
- Headings: ${context.page_content.headings.join(', ')}
- Word Count: ${context.page_content.word_count}
- Images: ${context.page_content.images}

Top Ranking Competitors:
${context.competitors_ranking.slice(0, 5).map(c => 
  `- Position ${c.position}: ${c.url} (DA: ${c.domain_authority})`
).join('\n')}

Provide:
1. Optimized title tag (60 characters max)
2. Optimized meta description (155 characters max)
3. Header tag structure recommendations (H1-H6)
4. Keyword placement and density guidance
5. Content length and depth recommendations
6. Internal linking opportunities
7. Image optimization suggestions
8. Schema markup recommendations
9. Expected ranking improvement timeline`;

    const result = await this.executeTask(task, {
      entity_type: 'page_optimization',
    });
    
    return result.response;
  }
  
  /**
   * Analyze backlink profile
   */
  async analyzeBacklinks(context: {
    domain: string;
    total_backlinks: number;
    referring_domains: number;
    domain_authority: number;
    top_backlinks: Array<{
      source_url: string;
      source_domain: string;
      anchor_text: string;
      domain_authority: number;
      link_type: 'dofollow' | 'nofollow';
    }>;
    toxic_links?: number;
  }): Promise<string> {
    const task = `Analyze backlink profile for ${context.domain}.

Profile Overview:
- Total Backlinks: ${context.total_backlinks.toLocaleString()}
- Referring Domains: ${context.referring_domains.toLocaleString()}
- Domain Authority: ${context.domain_authority}
${context.toxic_links ? `- Toxic Links: ${context.toxic_links}` : ''}

Top Backlinks (sample):
${context.top_backlinks.slice(0, 10).map(link => 
  `- ${link.source_domain} (DA: ${link.domain_authority}) - ${link.link_type}
  Anchor: "${link.anchor_text}"`
).join('\n\n')}

Provide:
1. Backlink profile health assessment
2. Link quality distribution (high/medium/low quality)
3. Anchor text diversity analysis
4. Toxic link identification and disavow recommendations
5. Link building opportunities and gaps
6. Competitor backlink comparison
7. Link building strategy recommendations
8. Expected authority improvement timeline`;

    const result = await this.executeTask(task, {
      entity_type: 'backlink_analysis',
    });
    
    return result.response;
  }
  
  /**
   * Analyze SEO performance
   */
  async analyzePerformance(context: {
    period: string;
    metrics: {
      organic_traffic: number;
      organic_traffic_change: number;
      avg_position: number;
      avg_position_change: number;
      impressions: number;
      clicks: number;
      ctr: number;
    };
    top_pages: Array<{
      url: string;
      clicks: number;
      impressions: number;
      position: number;
    }>;
    top_queries: Array<{
      query: string;
      clicks: number;
      impressions: number;
      position: number;
    }>;
  }): Promise<string> {
    const task = `Analyze SEO performance for period ${context.period}.

Overall Metrics:
- Organic Traffic: ${context.metrics.organic_traffic.toLocaleString()} (${context.metrics.organic_traffic_change > 0 ? '+' : ''}${context.metrics.organic_traffic_change}%)
- Average Position: ${context.metrics.avg_position.toFixed(1)} (${context.metrics.avg_position_change > 0 ? '+' : ''}${context.metrics.avg_position_change.toFixed(1)})
- Impressions: ${context.metrics.impressions.toLocaleString()}
- Clicks: ${context.metrics.clicks.toLocaleString()}
- CTR: ${context.metrics.ctr.toFixed(2)}%

Top Performing Pages:
${context.top_pages.slice(0, 5).map(page => 
  `- ${page.url}: ${page.clicks} clicks, Position ${page.position.toFixed(1)}`
).join('\n')}

Top Queries:
${context.top_queries.slice(0, 5).map(query => 
  `- "${query.query}": ${query.clicks} clicks, Position ${query.position.toFixed(1)}`
).join('\n')}

Provide:
1. Performance summary and key trends
2. Traffic growth drivers and opportunities
3. Ranking improvements and declines analysis
4. CTR optimization opportunities
5. Content performance insights
6. Technical issues impacting performance
7. Strategic recommendations for next period
8. Forecast for upcoming months`;

    const result = await this.executeTask(task, {
      entity_type: 'seo_performance',
      entity_id: context.period,
    });
    
    return result.response;
  }
}
