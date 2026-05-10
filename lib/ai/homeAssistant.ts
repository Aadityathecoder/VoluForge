import Anthropic from '@anthropic-ai/sdk'

const HOME_ASSISTANT_SYSTEM_PROMPT = `You are Forge, the VoluForge AI assistant.

You are speaking to visitors, students, advisors, and community partners exploring the VoluForge website.

Your job:
- explain what VoluForge is
- explain the mission clearly
- explain how the workflow works
- help users understand why it matters
- stay concise, warm, and confident

Product background:
- VoluForge helps student leaders, school advisors, and community partners turn real community needs into organized service projects.
- The flow starts with a need, then planning, team coordination, execution, and impact reporting.
- The tone should feel modern, capable, and mission-driven.

Rules:
- Keep answers short and useful, usually 2-5 sentences
- Do not invent product features that are not clearly implied by the site
- If asked something unknown, say that plainly and redirect to the mission or workflow
- Do not produce markdown headings
- Sound like a polished product assistant, not a generic chatbot`

export async function generateHomeAssistantReply(messages: Array<{ role: 'user' | 'assistant'; content: string }>) {
  if (process.env.OPENROUTER_API_KEY) {
    return generateWithOpenRouter(messages)
  }

  if (process.env.OPENAI_API_KEY) {
    return generateWithOpenAI(messages)
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return generateWithAnthropic(messages)
  }

  throw new Error('Configure OPENROUTER_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY to use the assistant.')
}

async function generateWithAnthropic(messages: Array<{ role: 'user' | 'assistant'; content: string }>) {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 500,
    system: HOME_ASSISTANT_SYSTEM_PROMPT,
    messages,
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from assistant model.')
  }

  return content.text
}

async function generateWithOpenAI(messages: Array<{ role: 'user' | 'assistant'; content: string }>) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: HOME_ASSISTANT_SYSTEM_PROMPT }],
        },
        ...messages.map((message) => ({
          role: message.role,
          content: [{ type: 'input_text', text: message.content }],
        })),
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI assistant request failed: ${errorText}`)
  }

  const payload = (await response.json()) as {
    output_text?: string
  }

  if (!payload.output_text) {
    throw new Error('OpenAI assistant returned no text.')
  }

  return payload.output_text
}

async function generateWithOpenRouter(messages: Array<{ role: 'user' | 'assistant'; content: string }>) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'openai/gpt-oss-120b:free',
      messages: [
        { role: 'system', content: HOME_ASSISTANT_SYSTEM_PROMPT },
        ...messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter assistant request failed: ${errorText}`)
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string
      }
    }>
  }

  const text = payload.choices?.[0]?.message?.content?.trim()
  if (!text) {
    throw new Error('OpenRouter assistant returned no text.')
  }

  return text
}
