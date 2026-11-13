'use client'
import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Notice } from '@/components/Notice'

export default function ForgotPassword() {
  const [state, setState] = useState<'idle' | 'busy' | 'sent'>('idle')
  const [error, setError] = useState('')
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState('busy'); setError('')
    const email = String(new FormData(e.currentTarget).get('email')).trim()
    const { error } = await createClient().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` })
    if (error) { setError(error.message); setState('idle'); return }
    setState('sent')
  }
  return (
    <>
      <h1 className="h-page">Reset your password</h1>
      {state === 'sent'
        ? <p className="mt-4 text-ink/75">If that email has an account, a reset link is on its way. Open it on this device.</p>
        : <form onSubmit={submit} className="mt-7 space-y-4">
            {error && <Notice tone="error">{error}</Notice>}
            <div><label htmlFor="email" className="label">Email</label><input id="email" name="email" type="email" autoComplete="email" required className="field" /></div>
            <button className="btn-primary w-full" disabled={state === 'busy'}>{state === 'busy' ? 'Sending…' : 'Send reset link'}</button>
          </form>}
      <p className="mt-6 text-sm"><Link href="/login" className="link">Back to sign in</Link></p>
    </>
  )
}
