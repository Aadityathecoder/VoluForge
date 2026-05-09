import Anthropic from '@anthropic-ai/sdk'
import { ProjectKitAIResponse } from '@/types/projectKit'
import { CommunityNeed } from '@/types/database'

function parseAIResponse(rawResponse: string): ProjectKitAIResponse {
  try {
    return JSON.parse(rawResponse) as ProjectKitAIResponse
  } catch {
    let repaired = rawResponse
      .replace(/[\x00-\x1F\x7F]/g, ' ')
      .trim()

    if (repaired.startsWith('```json')) {
      repaired = repaired.slice(7)
    }
    if (repaired.startsWith('```')) {
      repaired = repaired.slice(3)
    }
    if (repaired.endsWith('```')) {
      repaired = repaired.slice(0, -3)
    }

    repaired = repaired.trim()

    try {
      return JSON.parse(repaired) as ProjectKitAIResponse
    } catch {
      throw new Error('Failed to parse AI response as valid JSON')
    }
  }
}

const SYSTEM_PROMPT = `You are VoluForge, an AI assistant that helps student groups turn real community needs into safe, organized, executable service projects.

Given a community need, generate a complete student-led service project kit.

CRITICAL RULES:
- Be practical and realistic for high school students
- Avoid dangerous, medical, legal, or unsupervised recommendations
- Include adult supervision where appropriate
- Do not invent facts or impact numbers
- If information is missing, include assumptions labeled clearly
- Make the project low-cost when possible
- Keep tone professional but student-friendly
- Include safety concerns and permissions where relevant
- Return ONLY valid JSON, no markdown, no preamble

SAFETY GUARDRAILS:
- Do not recommend unsupervised work with vulnerable populations (minors, elderly, individuals with disabilities)
- Do not recommend tasks requiring professional licenses or certifications without explicit supervisor involvement
- Do not recommend handling sensitive personal information or medical situations
- Do not recommend driving or operating heavy machinery
- Do not recommend working at heights without proper safety equipment and trained supervision
- Flag any tasks that require background checks or special permissions

Return ONLY this JSON structure (no markdown, no explanation):
{
  "projectTitle": "string",
  "mission": "one sentence mission",
  "problemSummary": "string",
  "beneficiaries": "string",
  "estimatedImpact": "string",
  "recommendedProjectType": "string",
  "difficultyRating": "Low | Medium | High",
  "adultSupervisionRequirement": "string describing level needed",
  "assumptions": ["array of assumptions made"],
  "partnerQuestions": ["questions to confirm with the community partner"],
  "timeline": [
    {
      "phase": "string",
      "duration": "string",
      "tasks": ["task names"]
    }
  ],
  "volunteerRoles": [
    {
      "role": "string",
      "responsibilities": ["string"],
      "estimatedTime": "string"
    }
  ],
  "materials": [
    {
      "item": "string",
      "quantity": "string",
      "estimatedCost": "string",
      "notes": "string"
    }
  ],
  "budget": {
    "estimatedTotal": "string",
    "lowCostAlternatives": ["string"]
  },
  "safetyConsiderations": ["string"],
  "permissionsNeeded": ["string"],
  "outreach": {
    "donorEmail": "professional email body",
    "advisorEmail": "professional email body",
    "partnerEmail": "professional email body",
    "volunteerRecruitmentMessage": "message body",
    "socialMediaCaption": "caption for social media",
    "flyerCopy": "flyer text"
  },
  "executionChecklist": ["checklist items"],
  "impactMetrics": ["metrics to track"],
  "finalReportOutline": ["report sections"]
}`

export async function generateProjectKit(need: CommunityNeed): Promise<{
  success: boolean
  kit?: ProjectKitAIResponse
  error?: string
}> {
  try {
    const provider = process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'openai'

    let response: string

    if (provider === 'anthropic') {
      response = await generateWithAnthropic(need)
    } else {
      response = await generateWithOpenAI(need)
    }

    const kit = parseAIResponse(response)
    return { success: true, kit }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Project kit generation error:', errorMessage)
    return {
      success: false,
      error: errorMessage,
    }
  }
}

async function generateWithAnthropic(need: CommunityNeed): Promise<string> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const userPrompt = `
Community Need:
Organization: ${need.organization_name}
Category: ${need.category}
Description: ${need.description}
Beneficiaries: ${need.beneficiaries}
Estimated People Impacted: ${need.estimated_people_impacted ?? 'Unknown'}
Location: ${need.location}
Deadline: ${need.deadline ?? 'Flexible'}
Age Restrictions: ${need.age_restrictions ?? 'None specified'}
Safety Concerns: ${need.safety_concerns ?? 'None mentioned'}
Known Materials: ${need.known_materials ?? 'None specified'}
Budget Available: ${need.budget_estimate != null ? `$${need.budget_estimate}` : 'Unknown'}
Preferred Project Type: ${need.preferred_project_type ?? 'Not specified'}

Generate a complete, practical student-led project kit for this need.
`

  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude')
  }

  return content.text
}

async function generateWithOpenAI(_need: CommunityNeed): Promise<string> {
  throw new Error('OpenAI integration not yet implemented')
}

export async function generateProjectKitAction(_needId: string, needData: CommunityNeed) {
  'use server'

  void _needId
  return generateProjectKit(needData)
}
