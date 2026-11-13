import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireViewer } from '@/lib/viewer'
import { createClient } from '@/lib/supabase/server'
import type { AdminFellowship, RosterRow } from '@/lib/data'
import { FellowshipForm } from '@/components/FellowshipForm'
import { Status } from '@/components/FellowshipBits'
import { Notice } from '@/components/Notice'
import { SubmitButton } from '@/components/SubmitButton'
import { CopyCode } from './CopyCode'
import { fmtDate, plural } from '@/lib/format'
import { decide, deleteFellowship, newCode, setStatus } from '../../actions'

export const metadata: Metadata = { title: 'Manage fellowship' }
export default async function ManageFellowship({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string; edit?: string }> }) {
  const viewer = await requireViewer('admin')
  const { id } = await params
  const { error, saved, edit } = await searchParams
  const supabase = await createClient()
  const { data } = await supabase.rpc('vf_admin_fellowships')
  const f = ((data ?? []) as AdminFellowship[]).find(r => r.id === id)
  if (!f) notFound()
  const { data: rosterData } = await supabase.rpc('vf_admin_roster', { p_id: id })
  const roster = (rosterData ?? []) as RosterRow[]
  const active = roster.filter(r => r.status !== 'withdrawn')
  return (
    <div>
      <Link href="/admin" className="text-sm text-muted hover:text-ink">← Your fellowships</Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3"><Status value={f.status} /><span className="text-sm text-muted">{fmtDate(f.starts_on)} to {fmtDate(f.ends_on)}</span></div>
          <h1 className="h-page mt-2">{f.title}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {f.status !== 'open' && <form action={setStatus}><input type="hidden" name="id" value={f.id} /><input type="hidden" name="status" value="open" /><SubmitButton className="btn-ember btn-sm" pending="Opening…">Open applications</SubmitButton></form>}
          {f.status === 'open' && <form action={setStatus}><input type="hidden" name="id" value={f.id} /><input type="hidden" name="status" value="closed" /><SubmitButton className="btn-outline btn-sm" pending="Closing…">Close applications</SubmitButton></form>}
          <Link href={edit ? `/admin/fellowships/${f.id}` : `/admin/fellowships/${f.id}?edit=1`} className="btn-quiet btn-sm">{edit ? 'Done editing' : 'Edit details'}</Link>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {error && <Notice tone="error">{error}</Notice>}
        {saved === '1' && <Notice tone="success">Fellowship saved.</Notice>}
        {saved === 'status' && <Notice tone="success">{f.status === 'open' ? 'Applications are open.' : f.status === 'closed' ? 'Applications are closed.' : 'Saved.'}</Notice>}
        {saved === 'code' && <Notice tone="success">New join code created. The old code no longer works.</Notice>}
      </div>

      {edit ? <div className="mt-8 max-w-3xl"><FellowshipForm f={f} /></div> : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_300px]">
          <section id="roster" aria-labelledby="roster-h" className="scroll-mt-24">
            <div className="mb-4 flex items-baseline justify-between"><h2 id="roster-h" className="h-section">Applicants</h2><p className="text-sm text-muted">{f.accepted} of {f.capacity} seats filled</p></div>
            {active.length ? (
              <ul className="space-y-3">
                {active.map(r => (
                  <li key={r.student_id} className="panel p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div><p className="font-semibold">{r.full_name}</p><p className="text-sm text-muted">{r.school || 'School not added'} · applied {fmtDate(r.created_at, { month: 'short', day: 'numeric' })}</p></div>
                      <Status value={r.status} />
                    </div>
                    {r.message && <p className="mt-3 whitespace-pre-line text-[15px] text-ink/85">{r.message}</p>}
                    {(r.skills.length > 0 || r.causes.length > 0) && <div className="mt-3 flex flex-wrap gap-1.5">{[...r.skills, ...r.causes].slice(0, 10).map(s => <span key={s} className="tag bg-soft">{s}</span>)}</div>}
                    {r.admin_note && r.status !== 'pending' && <p className="mt-3 text-sm text-muted">Your note: {r.admin_note}</p>}
                    <form action={decide} className="mt-4 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:items-center">
                      <input type="hidden" name="id" value={f.id} /><input type="hidden" name="student" value={r.student_id} />
                      <label htmlFor={`note-${r.student_id}`} className="sr-only">Note to {r.full_name}</label>
                      <input id={`note-${r.student_id}`} name="note" maxLength={2000} placeholder="Optional note to the student" className="field py-2 text-sm sm:flex-1" />
                      <div className="flex gap-2">
                        {r.status !== 'accepted' && <SubmitButton className="btn-primary btn-sm" name="decision" value="accepted" pending="Saving…">Accept</SubmitButton>}
                        {r.status !== 'declined' && <SubmitButton className="btn-quiet btn-sm" name="decision" value="declined" pending="Saving…">Decline</SubmitButton>}
                      </div>
                    </form>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-lg border border-dashed border-ink/30 p-8 text-ink/75">
                {f.status === 'open' ? 'No applications yet. Share the join code with your students to get started.' : 'Open applications so students can apply.'}
              </div>
            )}
            {roster.length > active.length && <p className="mt-4 text-sm text-muted">{plural(roster.length - active.length, 'student')} withdrew.</p>}
          </section>

          <aside className="space-y-4">
            <div className="panel p-5">
              <h2 className="font-semibold">Join code</h2>
              <p className="mt-1 text-sm text-muted">{viewer.verified ? 'Your open fellowships are listed publicly. The code also takes students straight to this one.' : 'Students need this code to find this fellowship until your account is verified.'}</p>
              <CopyCode code={f.join_code} />
              <form action={newCode} className="mt-3"><input type="hidden" name="id" value={f.id} /><SubmitButton className="text-sm font-semibold text-forest hover:underline" pending="Creating…">Create a new code</SubmitButton></form>
            </div>
            <dl className="panel space-y-3 p-5 text-sm">
              <div><dt className="text-muted">Focus</dt><dd className="font-medium">{f.focus}</dd></div>
              <div><dt className="text-muted">Where</dt><dd className="font-medium">{f.remote ? 'Online' : f.location || 'Not set'}</dd></div>
              <div><dt className="text-muted">Commitment</dt><dd className="font-medium">{plural(f.weekly_hours, 'hour')} a week</dd></div>
              {f.apply_by && <div><dt className="text-muted">Apply by</dt><dd className="font-medium">{fmtDate(f.apply_by)}</dd></div>}
            </dl>
            {f.accepted === 0 && (
              <form action={deleteFellowship}><input type="hidden" name="id" value={f.id} /><SubmitButton className="text-sm font-semibold text-danger hover:underline" pending="Deleting…">Delete this fellowship</SubmitButton></form>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}
