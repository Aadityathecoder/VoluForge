'use client'
import { useState } from 'react'

export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    const link = `${window.location.origin}/fellowships?code=${code}`
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* clipboard blocked */ }
  }
  return (
    <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-ink bg-cream px-4 py-3">
      <span className="font-mono text-xl font-semibold tracking-[0.2em]">{code}</span>
      <button type="button" onClick={copy} className="text-sm font-semibold text-forest hover:underline" aria-live="polite">{copied ? 'Link copied' : 'Copy link'}</button>
    </div>
  )
}
