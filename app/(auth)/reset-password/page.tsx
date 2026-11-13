'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Notice } from '@/components/Notice'

export default function ResetPassword() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const password = String(new FormData(e.currentTarget).get('password'))
    if (password.length < 8) { setError('Use at least 8 characters.'); return }
    setBusy(true)
    const { error } = await createClient().auth.updateUser({ password })
    if (error) { setError(error.message.includes('session') ? 'This reset link has expired. Request a new one.' : error.message); setBusy(false); return }
    router.replace('/home'); router.refresh()
  }
  return (
    <>
      <h1 className="h-page">Choose a new password</h1>
      <form onSubmit={submit} className="mt-7 space-y-4">
        {error && <Notice tone="error">{error}</Notice>}
        <div><label htmlFor="password" className="label">New password</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className="field" /></div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Save password'}</button>
      </form>
    </>
  )
}
