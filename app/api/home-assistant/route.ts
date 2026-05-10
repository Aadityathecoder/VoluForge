import { NextResponse } from 'next/server'
import { generateHomeAssistantReply } from '@/lib/ai/homeAssistant'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { messages?: ChatMessage[] }
    const messages = body.messages?.filter(
      (message) =>
        (message.role === 'user' || message.role === 'assistant') &&
        typeof message.content === 'string' &&
        message.content.trim() !== ''
    )

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'At least one chat message is required.' }, { status: 400 })
    }

    const reply = await generateHomeAssistantReply(messages)
    return NextResponse.json({ reply })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Assistant request failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
