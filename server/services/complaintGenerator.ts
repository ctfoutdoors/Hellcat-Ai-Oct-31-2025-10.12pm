import { invokeLLM } from "../_core/llm";

interface CaseData {
  caseNumber: string;
  title: string;
  description: string;
  carrier: string;
  trackingNumber?: string;
  adjustmentId?: string;
  adjustmentAmount?: number;
  adjustmentReason?: string;
  claimAmount?: number;
  priority: string;
}

/**
 * Generate a professional complaint email to ShipStation support
 * using AI to compose the message based on case details
 */
export async function generateShipStationComplaint(caseData: CaseData): Promise<{
  subject: string;
  body: string;
}> {
  const prompt = `You are a professional business correspondence writer. Generate a formal complaint email to ShipStation support regarding a carrier adjustment dispute.

**Case Details:**
- Case Number: ${caseData.caseNumber}
- Title: ${caseData.title}
- Description: ${caseData.description}
- Carrier: ${caseData.carrier}
${caseData.trackingNumber ? `- Tracking Number: ${caseData.trackingNumber}` : ''}
${caseData.adjustmentId ? `- Adjustment ID: ${caseData.adjustmentId}` : ''}
${caseData.adjustmentAmount ? `- Adjustment Amount: $${caseData.adjustmentAmount}` : ''}
${caseData.adjustmentReason ? `- Adjustment Reason: ${caseData.adjustmentReason}` : ''}
${caseData.claimAmount ? `- Claim Amount: $${caseData.claimAmount}` : ''}
- Priority: ${caseData.priority}

**Requirements:**
1. Professional and courteous tone
2. Clearly state the issue and our dispute
3. Reference specific adjustment ID and tracking number
4. Request investigation and resolution
5. Mention attached proof/evidence (screenshots)
6. Request response timeline
7. Include our case number for reference

Generate:
1. Email subject line (concise, professional)
2. Email body (3-4 paragraphs, formal business style)

Format your response as JSON:
{
  "subject": "...",
  "body": "..."
}`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a professional business correspondence writer specializing in carrier dispute resolution. Generate clear, professional, and effective complaint emails."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "complaint_email",
        strict: true,
        schema: {
          type: "object",
          properties: {
            subject: {
              type: "string",
              description: "Professional email subject line"
            },
            body: {
              type: "string",
              description: "Professional email body with paragraphs"
            }
          },
          required: ["subject", "body"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("No response from LLM");
  }

  const parsed = JSON.parse(content);
  return {
    subject: parsed.subject,
    body: parsed.body
  };
}

/**
 * Generate AI-powered dispute letter for formal carrier disputes
 */
export async function generateDisputeLetter(caseData: CaseData, companyInfo: {
  name: string;
  address: string;
  phone: string;
  email: string;
}): Promise<string> {
  const prompt = `Generate a formal dispute letter on company letterhead for a carrier billing adjustment dispute.

**Company Information:**
${companyInfo.name}
${companyInfo.address}
Phone: ${companyInfo.phone}
Email: ${companyInfo.email}

**Case Details:**
- Case Number: ${caseData.caseNumber}
- Title: ${caseData.title}
- Description: ${caseData.description}
- Carrier: ${caseData.carrier}
${caseData.trackingNumber ? `- Tracking Number: ${caseData.trackingNumber}` : ''}
${caseData.adjustmentId ? `- Adjustment ID: ${caseData.adjustmentId}` : ''}
${caseData.adjustmentAmount ? `- Adjustment Amount: $${caseData.adjustmentAmount}` : ''}
${caseData.adjustmentReason ? `- Adjustment Reason: ${caseData.adjustmentReason}` : ''}
${caseData.claimAmount ? `- Claim Amount: $${caseData.claimAmount}` : ''}

**Requirements:**
1. Formal business letter format with date
2. Professional letterhead-style header
3. Clear statement of dispute
4. Supporting evidence references
5. Specific resolution requested
6. Timeline for response
7. Professional closing

Generate the complete letter in Markdown format with proper formatting.`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a professional legal correspondence writer specializing in carrier dispute resolution. Generate formal, legally sound dispute letters."
      },
      {
        role: "user",
        content: prompt
      }
    ]
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("No response from LLM");
  }

  return content;
}
