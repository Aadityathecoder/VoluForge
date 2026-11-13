'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GoogleButton } from '@/components/GoogleButton'
import { Notice } from '@/components/Notice'

export function LoginForm({ next, error: initialError }: { next: string; error?: string }) {
  const router = useRouter()
  const [error, setError] = useState(initialError ? 'That sign-in link did not work. Try again.' : '')
  const [busy, setBusy] = useState(false)
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setBusy(true); setError('')
    const { error } = await createClient().auth.signInWithPassword({ email: String(form.get('email')).trim(), password: String(form.get('password')) })
    if (error) { setError(error.message === 'Invalid login credentials' ? 'That email and password do not match an account.' : error.message); setBusy(false); return }
    router.replace(next); router.refresh()
  }
  return (
    <>
      <h1 className="h-page">Sign in</h1>
      <p className="mt-2 text-ink/70">Students and administrators use the same sign-in.</p>
      <div className="mt-8"><GoogleButton next={next} /></div>
      <div className="my-6 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />or with email<span className="h-px flex-1 bg-line" /></div>
      <form onSubmit={submit} className="space-y-4">
        {error && <Notice tone="error">{error}</Notice>}
        <div><label htmlFor="email" className="label">Email</label><input id="email" name="email" type="email" autoComplete="email" required className="field" /></div>
        <div>
          <div className="flex items-baseline justify-between"><label htmlFor="password" className="label">Password</label><Link href="/forgot-password" className="text-sm text-forest hover:underline">Forgot it?</Link></div>
          <input id="password" name="password" type="password" autoComplete="current-password" required className="field" />
        </div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p className="mt-6 text-sm text-ink/70">New to VoluForge? <Link href="/signup" className="link">Create an account</Link></p>
    </>
  )
}
