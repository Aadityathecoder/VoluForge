import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireViewer } from '@/lib/viewer'
import { fellowshipDirectory } from '@/lib/data'
import { Status } from '@/components/FellowshipBits'
import { Notice } from '@/components/Notice'
import { SubmitButton } from '@/components/SubmitButton'
import { fmtDate, plural } from '@/lib/format'
import { applyToFellowship, withdrawFromFellowship } from '../actions'

export const metadata: Metadata = { title: 'Fellowship' }
export default async function FellowshipPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ code?: string; error?: string; done?: string }> }) {
  await requireViewer('student')
  const { id } = await params
  const { code, error, done } = await searchParams
  const f = (await fellowshipDirectory(code)).rows.find(r => r.id === id)
  if (!f) notFound()
  const canApply = f.status === 'open' && (!f.my_status || f.my_status === 'withdrawn') && f.seats_left > 0
  return (
    <div>
      <Link href="/fellowships" className="text-sm text-muted hover:text-ink">← All fellowships</Link>
      <div className="mt-6 grid gap-12 lg:grid-cols-[1fr_340px]">
        <article>
          <p className="text-muted">{f.host}{f.host_verified && <span className="ml-2 text-sm text-forest">Verified host</span>}</p>
          <h1 className="h-page mt-1">{f.title}</h1>
          {f.summary && <p className="mt-4 max-w-2xl text-lg text-ink/75">{f.summary}</p>}
          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
            {[['Runs', `${fmtDate(f.starts_on, { month: 'short', day: 'numeric' })} – ${fmtDate(f.ends_on, { month: 'short', day: 'numeric' })}`], ['Commitment', `${plural(f.weekly_hours, 'hour')} a week`], ['Where', f.remote ? 'Online' : f.location || 'In person'], ['Focus', f.focus]].map(([k, v]) => (
              <div key={k} className="bg-paper p-4"><dt className="text-xs text-muted">{k}</dt><dd className="mt-1 font-semibold">{v}</dd></div>
            ))}
          </dl>
          {f.description && <div className="mt-8 max-w-2xl whitespace-pre-line leading-relaxed text-ink/85">{f.description}</div>}
        </article>
        <aside>
          <div className="panel p-6 lg:sticky lg:top-24">
            {done === 'applied' && <div className="mb-4"><Notice tone="success">Application sent. You'll see the decision here and on your home page.</Notice></div>}
            {done === 'withdrawn' && <div className="mb-4"><Notice>You withdrew your application.</Notice></div>}
            {error && <div className="mb-4"><Notice tone="error">{error}</Notice></div>}
            <p className="text-sm"><b className="font-semibold">{plural(f.seats_left, 'seat')}</b> left of {f.capacity}</p>
            {f.apply_by && <p className="mt-1 text-sm text-ember-dark">Apply by {fmtDate(f.apply_by)}</p>}
            {f.my_status && f.my_status !== 'withdrawn' ? (
              <div className="mt-5 space-y-4">
                <div className="flex items-center gap-2 text-sm">Your application: <Status value={f.my_status} /></div>
                {(f.my_status === 'pending' || f.my_status === 'accepted') && (
                  <form action={withdrawFromFellowship}><input type="hidden" name="id" value={f.id} /><SubmitButton className="btn-quiet w-full" pending="Withdrawing…">Withdraw application</SubmitButton></form>
                )}
              </div>
            ) : canApply ? (
              <form action={applyToFellowship} className="mt-5 space-y-4">
                <input type="hidden" name="id" value={f.id} />
                {code && <input type="hidden" name="code" value={code} />}
                <div>
                  <label htmlFor="message" className="label">Why do you want to join?</label>
                  <textarea id="message" name="message" rows={5} maxLength={2000} className="field" placeholder="A few sentences is plenty." />
                  <p className="hint">The host sees this with your name, school and skills.</p>
                </div>
                <SubmitButton className="btn-ember w-full" pending="Sending…">Apply to this fellowship</SubmitButton>
              </form>
            ) : (
              <p className="mt-5 text-sm text-muted">{f.status !== 'open' ? 'This fellowship is not taking applications.' : 'All seats are taken.'}</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
