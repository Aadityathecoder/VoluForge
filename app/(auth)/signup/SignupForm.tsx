'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GoogleButton } from '@/components/GoogleButton'
import { Notice } from '@/components/Notice'

type Role = 'student' | 'admin'
export function SignupForm({ initialRole }: { initialRole: Role }) {
  const router = useRouter()
  const [role, setRole] = useState<Role>(initialRole)
  const [error, setError] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email')).trim()
    const password = String(form.get('password'))
    if (password.length < 8) { setError('Use at least 8 characters for your password.'); return }
    setBusy(true); setError('')
    const { data, error } = await createClient().auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${role === 'admin' ? '/admin' : '/home'}`,
        data: { full_name: String(form.get('name')).trim(), account_type: role, organization_name: role === 'admin' ? String(form.get('organization')).trim() : '' },
      },
    })
    setBusy(false)
    if (error) { setError(error.message); return }
    if (data.session) { router.replace(role === 'admin' ? '/admin' : '/home'); router.refresh(); return }
    setSentTo(email)
  }

  if (sentTo) return (
    <>
      <h1 className="h-page">Check your email</h1>
      <p className="mt-3 text-ink/75">We sent a confirmation link to <b className="font-semibold">{sentTo}</b>. Open it on this device to finish creating your account.</p>
      <p className="mt-6 text-sm text-ink/70">Wrong address? <button className="link" onClick={() => setSentTo('')}>Start again</button></p>
    </>
  )

  return (
    <>
      <h1 className="h-page">Create your account</h1>
      <fieldset className="mt-7">
        <legend className="label">I am</legend>
        <div className="grid grid-cols-2 gap-2" role="radiogroup">
          {([['student', 'A student', 'Join fellowships and volunteer'], ['admin', 'An administrator', 'Create and run fellowships']] as const).map(([value, title, body]) => (
            <label key={value} className={`cursor-pointer rounded-md border p-3.5 transition-colors ${role === value ? 'border-ink bg-paper ring-1 ring-ink' : 'border-line hover:border-ink/40'}`}>
              <input type="radio" name="role" value={value} checked={role === value} onChange={() => setRole(value)} className="sr-only" />
              <span className="block font-semibold">{title}</span>
              <span className="mt-0.5 block text-[13px] leading-snug text-muted">{body}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-6"><GoogleButton label="Sign up with Google" next={`/onboarding?role=${role}`} /></div>
      <div className="my-6 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />or with email<span className="h-px flex-1 bg-line" /></div>
      <form onSubmit={submit} className="space-y-4">
        {error && <Notice tone="error">{error}</Notice>}
        <div><label htmlFor="name" className="label">Full name</label><input id="name" name="name" autoComplete="name" required maxLength={120} className="field" /></div>
        {role === 'admin' && (
          <div>
            <label htmlFor="organization" className="label">School or organization</label>
            <input id="organization" name="organization" required minLength={2} maxLength={200} className="field" />
            <p className="hint">Students see this as the host of your fellowships.</p>
          </div>
        )}
        <div><label htmlFor="email" className="label">Email</label><input id="email" name="email" type="email" autoComplete="email" required className="field" /></div>
        <div><label htmlFor="password" className="label">Password</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className="field" /><p className="hint">At least 8 characters.</p></div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating account…' : role === 'admin' ? 'Create administrator account' : 'Create student account'}</button>
      </form>
      <p className="mt-6 text-sm text-ink/70">Already have an account? <Link href="/login" className="link">Sign in</Link></p>
    </>
  )
}
