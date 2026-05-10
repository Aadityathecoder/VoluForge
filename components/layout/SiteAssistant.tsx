'use client'

import { FormEvent, useState, useTransition } from 'react'
import { Bot, LoaderCircle, MessageSquare, Send, X } from 'lucide-react'

type Message = {
  role: 'assistant' | 'user'
  content: string
}

const INITIAL_MESSAGE =
  "Hi, I'm Forge, the VoluForge AI assistant. I can explain our mission, how the platform works, and why we built it."

export function SiteAssistant() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: INITIAL_MESSAGE }])
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const prompt = input.trim()
    if (!prompt || isPending) return

    setError('')
    setInput('')

    const nextMessages: Message[] = [...messages, { role: 'user', content: prompt }]
    setMessages(nextMessages)

    startTransition(async () => {
      try {
        const response = await fetch('/api/home-assistant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: nextMessages.map((message) => ({
              role: message.role,
              content: message.content,
            })),
          }),
        })

        const payload = (await response.json()) as { reply?: string; error?: string }
        if (!response.ok || !payload.reply) {
          throw new Error(payload.error || 'Assistant response failed.')
        }

        setMessages((current) => [...current, { role: 'assistant', content: payload.reply! }])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Assistant response failed.')
      }
    })
  }

  return (
    <div className="assistant-floating">
      {open && (
        <div className="assistant-panel mb-3 w-[min(25rem,calc(100vw-1.25rem))] rounded-[1.75rem] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="assistant-avatar mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl">
                <Bot className="h-5 w-5 text-sky-50" />
              </div>
              <div>
                <p className="theme-strong-text text-base font-semibold">Forge</p>
                <p className="theme-soft-text text-sm">VoluForge AI assistant</p>
              </div>
            </div>

            <button type="button" onClick={() => setOpen(false)} className="assistant-close" aria-label="Close AI assistant">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 max-h-[22rem] space-y-3 overflow-y-auto pr-1">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === 'assistant'
                    ? 'bg-white/70 text-slate-700 dark:bg-slate-900/50 dark:text-slate-100'
                    : 'bg-sky-500 text-white'
                }`}
              >
                {message.content}
              </div>
            ))}
            {isPending && (
              <div className="rounded-2xl bg-white/70 px-4 py-3 text-sm text-slate-600 dark:bg-slate-900/50 dark:text-slate-200">
                <span className="inline-flex items-center gap-2">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Thinking…
                </span>
              </div>
            )}
          </div>

          {error && <p className="mt-3 text-sm text-red-500 dark:text-red-300">{error}</p>}

          <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask what VoluForge does..."
              className="assistant-input"
              disabled={isPending}
            />
            <button type="submit" className="assistant-send" disabled={isPending || input.trim() === ''} aria-label="Send message">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      <button type="button" onClick={() => setOpen((value) => !value)} className="theme-toggle" aria-label="Toggle AI assistant">
        <MessageSquare className="h-4 w-4" />
      </button>
    </div>
  )
}
