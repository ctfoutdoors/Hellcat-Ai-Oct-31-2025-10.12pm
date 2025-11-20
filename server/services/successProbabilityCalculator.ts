import { invokeLLM } from '../_core/llm';

interface CaseDataForAnalysis {
  title: string;
  description?: string;
  caseType: string;
  carrier: string;
  trackingNumber?: string;
  claimAmount?: string;
  priority?: string;
  customerName?: string;
  shipDate?: string;
  deliveryDate?: string;
}

interface SuccessProbabilityResult {
  probability: number; // 0-100
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
  recommendations: string[];
}

/**
 * Calculate the success probability of a dispute case using AI analysis
 * Returns probability score (0-100) and recommendations
 */
export async function calculateSuccessProbability(
  caseData: CaseDataForAnalysis
): Promise<SuccessProbabilityResult> {
  const prompt = `Analyze this carrier dispute case and estimate the probability of successfully recovering the claim amount.

Case Details:
- Title: ${caseData.title}
- Description: ${caseData.description || 'Not provided'}
- Case Type: ${caseData.caseType}
- Carrier: ${caseData.carrier}
- Tracking Number: ${caseData.trackingNumber || 'Not provided'}
- Claim Amount: ${caseData.claimAmount ? `$${caseData.claimAmount}` : 'Not specified'}
- Priority: ${caseData.priority || 'Not specified'}

Consider these factors in your analysis:
1. **Case Type Strength**: How strong is this type of claim historically? (late delivery, lost package, damaged goods, etc.)
2. **Carrier Policies**: Different carriers have different dispute resolution rates and policies
3. **Evidence Quality**: Based on the description, how well-documented is the case?
4. **Claim Amount**: Is the claim amount reasonable and well-justified?
5. **Tracking Information**: Does the tracking number provide evidence to support the claim?

Provide your analysis in this EXACT JSON format:
{
  "probability": <number 0-100>,
  "confidence": "<low|medium|high>",
  "reasoning": "<2-3 sentence explanation of the probability score>",
  "recommendations": ["<recommendation 1>", "<recommendation 2>", "<recommendation 3>"]
}

Be realistic and data-driven in your assessment. Consider industry standards for dispute resolution rates.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are an expert in carrier dispute resolution with 10+ years of experience analyzing claim success rates. Provide accurate, data-driven probability assessments based on case details.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'success_probability_analysis',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              probability: {
                type: 'number',
                description: 'Success probability from 0 to 100',
              },
              confidence: {
                type: 'string',
                enum: ['low', 'medium', 'high'],
                description: 'Confidence level in the prediction',
              },
              reasoning: {
                type: 'string',
                description: 'Explanation of the probability score',
              },
              recommendations: {
                type: 'array',
                items: {
                  type: 'string',
                },
                description: 'List of actionable recommendations',
              },
            },
            required: ['probability', 'confidence', 'reasoning', 'recommendations'],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content || '{}';
    const result = JSON.parse(content) as SuccessProbabilityResult;

    // Validate and clamp probability
    result.probability = Math.max(0, Math.min(100, result.probability));

    return result;
  } catch (error: any) {
    console.error('[SuccessProbability] Error calculating probability:', error);
    
    // Return a default moderate assessment if AI fails
    return {
      probability: 50,
      confidence: 'low',
      reasoning: 'Unable to perform detailed analysis. This is a default moderate assessment.',
      recommendations: [
        'Gather more evidence and documentation',
        'Contact the carrier directly for status update',
        'Review carrier-specific dispute policies',
      ],
    };
  }
}

/**
 * Get visual indicator for probability score
 */
export function getProbabilityIndicator(probability: number): {
  label: string;
  color: string;
  icon: string;
} {
  if (probability >= 75) {
    return {
      label: 'High Success Probability',
      color: 'green',
      icon: 'trending-up',
    };
  } else if (probability >= 50) {
    return {
      label: 'Moderate Success Probability',
      color: 'yellow',
      icon: 'minus',
    };
  } else if (probability >= 25) {
    return {
      label: 'Low Success Probability',
      color: 'orange',
      icon: 'trending-down',
    };
  } else {
    return {
      label: 'Very Low Success Probability',
      color: 'red',
      icon: 'x-circle',
    };
  }
}
