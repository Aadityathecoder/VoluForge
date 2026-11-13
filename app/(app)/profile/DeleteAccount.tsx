'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function DeleteAccount() {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function remove() {
    setBusy(true); setError('')
    const supabase = createClient()
    const { error } = await supabase.functions.invoke('delete-account', { body: { confirmation: 'DELETE' } })
    if (error) { setError('Your account could not be deleted. Try again, or contact support.'); setBusy(false); return }
    await supabase.auth.signOut()
    window.location.assign('/')
  }
  if (!open) return <button onClick={() => setOpen(true)} className="mt-6 text-sm font-semibold text-danger hover:underline">Delete account…</button>
  return (
    <div className="mt-6 rounded-lg border border-danger/30 bg-peach/40 p-5">
      <p className="font-semibold">Delete your VoluForge account?</p>
      <p className="mt-1 text-sm text-ink/75">This removes your profile, applications, fellowships you host and logged hours. It can't be undone.</p>
      <label htmlFor="confirm" className="label mt-4">Type DELETE to confirm</label>
      <input id="confirm" value={text} onChange={e => setText(e.target.value)} className="field max-w-xs" />
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
      <div className="mt-4 flex gap-2">
        <button onClick={remove} disabled={text !== 'DELETE' || busy} className="btn bg-danger text-paper hover:bg-danger/90">{busy ? 'Deleting…' : 'Delete my account'}</button>
        <button onClick={() => { setOpen(false); setText('') }} className="btn-quiet">Keep my account</button>
      </div>
    </div>
  )
}
