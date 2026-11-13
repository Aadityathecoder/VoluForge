import type { Metadata } from 'next'
import { requireViewer } from '@/lib/viewer'
import { createClient } from '@/lib/supabase/server'
import { Notice } from '@/components/Notice'
import { SubmitButton } from '@/components/SubmitButton'
import { DeleteAccount } from './DeleteAccount'
import { saveProfile } from './actions'

export const metadata: Metadata = { title: 'Profile and settings' }
export default async function Profile({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const viewer = await requireViewer()
  const { saved, error } = await searchParams
  const supabase = await createClient()
  const { data: p } = await supabase.from('vf_profiles').select('*').eq('id', viewer.id).maybeSingle()
  const admin = viewer.accountType === 'admin'
  return (
    <div className="max-w-2xl">
      <h1 className="h-page">Profile and settings</h1>
      <p className="mt-2 text-ink/70">{admin ? `Administrator account for ${viewer.organization || 'your organization'}.` : 'Fellowship hosts see your name, school, skills and interests when you apply.'}</p>
      <form action={saveProfile} className="mt-8 space-y-5">
        {saved && <Notice tone="success">Profile saved.</Notice>}
        {error && <Notice tone="error">{error}</Notice>}
        <div className="grid gap-5 sm:grid-cols-2">
          <div><label htmlFor="full_name" className="label">Full name</label><input id="full_name" name="full_name" defaultValue={p?.full_name ?? ''} maxLength={120} className="field" /></div>
          <div><label htmlFor="school" className="label">School</label><input id="school" name="school" defaultValue={p?.school ?? ''} maxLength={200} className="field" /></div>
        </div>
        <div><label htmlFor="bio" className="label">About you</label><textarea id="bio" name="bio" rows={3} defaultValue={p?.bio ?? ''} maxLength={1000} className="field" /></div>
        {!admin && <>
          <div><label htmlFor="skills" className="label">Skills</label><input id="skills" name="skills" defaultValue={(p?.skills ?? []).join(', ')} className="field" /><p className="hint">Separate with commas, e.g. Tutoring, Spanish, Design</p></div>
          <div><label htmlFor="causes" className="label">Causes you care about</label><input id="causes" name="causes" defaultValue={(p?.causes ?? []).join(', ')} className="field" /></div>
          <div className="max-w-40"><label htmlFor="goal_hours" className="label">Hours goal</label><input id="goal_hours" name="goal_hours" type="number" min={1} max={10000} defaultValue={p?.goal_hours ?? 50} className="field" /></div>
        </>}
        <SubmitButton pending="Saving…">Save profile</SubmitButton>
      </form>
      <section className="mt-14 border-t border-line pt-8">
        <h2 className="h-section">Account</h2>
        <dl className="mt-4 space-y-2 text-sm"><div className="flex gap-3"><dt className="w-28 text-muted">Email</dt><dd>{viewer.email}</dd></div><div className="flex gap-3"><dt className="w-28 text-muted">Account type</dt><dd>{admin ? 'Administrator' : 'Student'}</dd></div></dl>
        <DeleteAccount />
      </section>
    </div>
  )
}
