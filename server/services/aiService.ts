import { invokeLLM } from "../_core/llm";

/**
 * AI Service - Centralized AI integration for intelligence analysis
 */

export interface LeadAnalysisResult {
  score: number;
  reasoning: string;
  strengths: string[];
  concerns: string[];
  recommendation: string;
}

export interface CompetitorChangeAnalysis {
  significance: "low" | "medium" | "high" | "critical";
  summary: string;
  implications: string[];
  recommendedActions: string[];
}

export interface DocumentSummary {
  summary: string;
  keyPoints: string[];
  relevantTopics: string[];
  sentiment: "positive" | "neutral" | "negative";
}

export interface PersonAnalysis {
  backgroundSummary: string;
  influenceLevel: "low" | "medium" | "high" | "very_high";
  keyRelationships: string[];
  careerHighlights: string[];
  potentialValue: string;
}

/**
 * Analyze lead quality and generate scoring
 */
export async function analyzeLeadQuality(leadData: {
  companyName?: string;
  companyIndustry?: string;
  companySize?: string;
  personName?: string;
  personTitle?: string;
  source?: string;
  additionalContext?: string;
}): Promise<LeadAnalysisResult> {
  const prompt = `You are an expert sales intelligence analyst. Analyze this lead and provide a detailed assessment.

Lead Information:
- Company: ${leadData.companyName || "Unknown"}
- Industry: ${leadData.companyIndustry || "Unknown"}
- Company Size: ${leadData.companySize || "Unknown"}
- Contact: ${leadData.personName || "Unknown"}
- Title: ${leadData.personTitle || "Unknown"}
- Source: ${leadData.source || "Unknown"}
- Additional Context: ${leadData.additionalContext || "None"}

Provide your analysis in the following JSON format:
{
  "score": <number 0-100>,
  "reasoning": "<detailed explanation of the score>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "concerns": ["<concern 1>", "<concern 2>", ...],
  "recommendation": "<action recommendation>"
}`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are an expert sales intelligence analyst specializing in lead qualification and scoring.",
      },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "lead_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            score: { type: "number", description: "Lead quality score from 0-100" },
            reasoning: { type: "string", description: "Detailed explanation of the score" },
            strengths: {
              type: "array",
              items: { type: "string" },
              description: "List of lead strengths",
            },
            concerns: {
              type: "array",
              items: { type: "string" },
              description: "List of potential concerns",
            },
            recommendation: { type: "string", description: "Action recommendation" },
          },
          required: ["score", "reasoning", "strengths", "concerns", "recommendation"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
  return JSON.parse(contentStr || "{}");
}

/**
 * Analyze competitor changes for significance
 */
export async function analyzeCompetitorChange(changeData: {
  competitorName: string;
  changeType: string;
  changeDescription: string;
  previousState?: string;
  newState?: string;
}): Promise<CompetitorChangeAnalysis> {
  const prompt = `You are a competitive intelligence analyst. Analyze this competitor change and assess its significance.

Competitor: ${changeData.competitorName}
Change Type: ${changeData.changeType}
Description: ${changeData.changeDescription}
Previous State: ${changeData.previousState || "Unknown"}
New State: ${changeData.newState || "Unknown"}

Provide your analysis in the following JSON format:
{
  "significance": "<low|medium|high|critical>",
  "summary": "<brief summary of the change>",
  "implications": ["<implication 1>", "<implication 2>", ...],
  "recommendedActions": ["<action 1>", "<action 2>", ...]
}`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a competitive intelligence analyst specializing in market dynamics and strategic implications.",
      },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "competitor_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            significance: {
              type: "string",
              enum: ["low", "medium", "high", "critical"],
              description: "Significance level of the change",
            },
            summary: { type: "string", description: "Brief summary of the change" },
            implications: {
              type: "array",
              items: { type: "string" },
              description: "Strategic implications",
            },
            recommendedActions: {
              type: "array",
              items: { type: "string" },
              description: "Recommended actions to take",
            },
          },
          required: ["significance", "summary", "implications", "recommendedActions"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
  return JSON.parse(contentStr || "{}");
}

/**
 * Generate document summary and extract key insights
 */
export async function summarizeDocument(documentData: {
  title: string;
  content: string;
  url?: string;
}): Promise<DocumentSummary> {
  const prompt = `You are a research analyst. Summarize this document and extract key insights.

Title: ${documentData.title}
URL: ${documentData.url || "N/A"}
Content: ${documentData.content.substring(0, 5000)}...

Provide your analysis in the following JSON format:
{
  "summary": "<executive summary>",
  "keyPoints": ["<point 1>", "<point 2>", ...],
  "relevantTopics": ["<topic 1>", "<topic 2>", ...],
  "sentiment": "<positive|neutral|negative>"
}`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a research analyst specializing in information synthesis and insight extraction.",
      },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "document_summary",
        strict: true,
        schema: {
          type: "object",
          properties: {
            summary: { type: "string", description: "Executive summary of the document" },
            keyPoints: {
              type: "array",
              items: { type: "string" },
              description: "Key points from the document",
            },
            relevantTopics: {
              type: "array",
              items: { type: "string" },
              description: "Relevant topics covered",
            },
            sentiment: {
              type: "string",
              enum: ["positive", "neutral", "negative"],
              description: "Overall sentiment",
            },
          },
          required: ["summary", "keyPoints", "relevantTopics", "sentiment"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
  return JSON.parse(contentStr || "{}");
}

/**
 * Analyze person profile and background
 */
export async function analyzePersonProfile(personData: {
  name: string;
  currentTitle?: string;
  currentCompany?: string;
  careerHistory?: string;
  education?: string;
  publications?: string;
  linkedinUrl?: string;
}): Promise<PersonAnalysis> {
  const prompt = `You are a people intelligence analyst. Analyze this person's profile and assess their influence and potential value.

Name: ${personData.name}
Current Title: ${personData.currentTitle || "Unknown"}
Current Company: ${personData.currentCompany || "Unknown"}
Career History: ${personData.careerHistory || "Not provided"}
Education: ${personData.education || "Not provided"}
Publications: ${personData.publications || "Not provided"}
LinkedIn: ${personData.linkedinUrl || "Not provided"}

Provide your analysis in the following JSON format:
{
  "backgroundSummary": "<comprehensive background summary>",
  "influenceLevel": "<low|medium|high|very_high>",
  "keyRelationships": ["<relationship 1>", "<relationship 2>", ...],
  "careerHighlights": ["<highlight 1>", "<highlight 2>", ...],
  "potentialValue": "<assessment of potential value for engagement>"
}`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a people intelligence analyst specializing in professional background analysis and influence assessment.",
      },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "person_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            backgroundSummary: { type: "string", description: "Comprehensive background summary" },
            influenceLevel: {
              type: "string",
              enum: ["low", "medium", "high", "very_high"],
              description: "Influence level in the industry",
            },
            keyRelationships: {
              type: "array",
              items: { type: "string" },
              description: "Key relationships and connections",
            },
            careerHighlights: {
              type: "array",
              items: { type: "string" },
              description: "Notable career achievements",
            },
            potentialValue: { type: "string", description: "Assessment of potential value" },
          },
          required: ["backgroundSummary", "influenceLevel", "keyRelationships", "careerHighlights", "potentialValue"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
  return JSON.parse(contentStr || "{}");
}

/**
 * Generate natural language query response
 */
export async function queryIntelligence(query: string, context?: string): Promise<string> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are an AI intelligence assistant for the Hellcat Intelligence Platform. You help users understand their data, generate insights, and make strategic decisions. Provide clear, actionable responses.",
      },
      {
        role: "user",
        content: context ? `Context: ${context}\n\nQuery: ${query}` : query,
      },
    ],
  });

  const content = response.choices[0].message.content;
  return typeof content === 'string' ? content : JSON.stringify(content);
}
