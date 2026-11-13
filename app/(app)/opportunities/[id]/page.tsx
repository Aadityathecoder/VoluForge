import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireViewer } from '@/lib/viewer'
import { createClient } from '@/lib/supabase/server'
import { opportunities } from '@/lib/data'
import { Status } from '@/components/FellowshipBits'
import { Notice } from '@/components/Notice'
import { SubmitButton } from '@/components/SubmitButton'
import { fmtDate, fmtTime } from '@/lib/format'
import { applyToOpportunity, withdrawApplication } from '../actions'

export const metadata: Metadata = { title: 'Opportunity' }
export default async function OpportunityPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; done?: string }> }) {
  const viewer = await requireViewer('student')
  const { id } = await params
  const { error, done } = await searchParams
  const o = (await opportunities()).rows.find(r => r.id === id)
  if (!o) notFound()
  const supabase = await createClient()
  const { data: app } = await supabase.from('vf_applications').select('id,status,decision_note').eq('student_id', viewer.id).eq('opportunity_id', id).maybeSingle()
  const active = app && app.status !== 'withdrawn'
  return (
    <div>
      <Link href="/opportunities" className="text-sm text-muted hover:text-ink">← All opportunities</Link>
      <div className="mt-6 grid gap-12 lg:grid-cols-[1fr_340px]">
        <article>
          <p className="text-muted">{o.organization} · {o.category}</p>
          <h1 className="h-page mt-1">{o.title}</h1>
          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
            {[['When', fmtDate(o.starts_at, { weekday: 'short', month: 'short', day: 'numeric' })], ['Time', `${fmtTime(o.starts_at)} – ${fmtTime(o.ends_at)}`], ['Where', o.remote ? 'Online' : o.location || 'In person'], ['Ages', `${o.min_age}+`]].map(([k, v]) => (
              <div key={k} className="bg-paper p-4"><dt className="text-xs text-muted">{k}</dt><dd className="mt-1 font-semibold">{v}</dd></div>
            ))}
          </dl>
          <div className="mt-8 max-w-2xl whitespace-pre-line leading-relaxed text-ink/85">{o.description}</div>
          {o.skills.length > 0 && <div className="mt-6 flex flex-wrap gap-2">{o.skills.map(s => <span key={s} className="tag bg-soft">{s}</span>)}</div>}
        </article>
        <aside>
          <div className="panel p-6 lg:sticky lg:top-24">
            {done === 'applied' && <div className="mb-4"><Notice tone="success">Application sent to {o.organization}.</Notice></div>}
            {error && <div className="mb-4"><Notice tone="error">{error}</Notice></div>}
            <p className="text-sm">{o.spots_left > 0 ? <><b className="font-semibold">{o.spots_left}</b> of {o.capacity} spots left</> : 'This opportunity is full.'}</p>
            {active ? (
              <div className="mt-5 space-y-4">
                <div className="flex items-center gap-2 text-sm">Your application: <Status value={app.status} /></div>
                {app.decision_note && <p className="text-sm text-ink/75">“{app.decision_note}”</p>}
                {app.status === 'pending' && <form action={withdrawApplication}><input type="hidden" name="id" value={o.id} /><input type="hidden" name="application" value={app.id} /><SubmitButton className="btn-quiet w-full" pending="Withdrawing…">Withdraw application</SubmitButton></form>}
              </div>
            ) : o.spots_left > 0 && !app ? (
              <form action={applyToOpportunity} className="mt-5 space-y-4">
                <input type="hidden" name="id" value={o.id} />
                <div><label htmlFor="message" className="label">Message to the organizer</label><textarea id="message" name="message" rows={4} maxLength={2000} required minLength={10} className="field" /></div>
                <div><label htmlFor="availability" className="label">Your availability</label><input id="availability" name="availability" required maxLength={500} className="field" placeholder="Free the whole shift" /></div>
                <SubmitButton className="btn-ember w-full" pending="Sending…">Apply</SubmitButton>
              </form>
            ) : app ? <p className="mt-5 text-sm text-muted">You withdrew from this opportunity.</p> : null}
          </div>
        </aside>
      </div>
    </div>
  )
}
