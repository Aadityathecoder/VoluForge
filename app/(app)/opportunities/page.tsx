import type { Metadata } from 'next'
import Link from 'next/link'
import { requireViewer } from '@/lib/viewer'
import { opportunities } from '@/lib/data'
import { fmtDate, fmtTime, plural } from '@/lib/format'

export const metadata: Metadata = { title: 'Volunteer opportunities' }
export default async function Opportunities({ searchParams }: { searchParams: Promise<{ q?: string; cause?: string }> }) {
  await requireViewer('student')
  const { q = '', cause = '' } = await searchParams
  const { rows } = await opportunities()
  const causes = [...new Set(rows.map(o => o.category))].sort()
  const needle = q.trim().toLowerCase()
  const list = rows.filter(o => (!cause || o.category === cause) && (!needle || `${o.title} ${o.organization} ${o.description} ${o.location}`.toLowerCase().includes(needle)))
  return (
    <div>
      <h1 className="h-page">Volunteer opportunities</h1>
      <p className="mt-2 text-ink/70">One-off shifts and projects from verified community organizations.</p>
      <form className="mt-8 flex flex-col gap-3 sm:flex-row" role="search">
        <label htmlFor="q" className="sr-only">Search</label>
        <input id="q" name="q" defaultValue={q} placeholder="Search by title, organization or place" className="field sm:max-w-md" />
        <label htmlFor="cause" className="sr-only">Cause</label>
        <select id="cause" name="cause" defaultValue={cause} className="field sm:w-52"><option value="">All causes</option>{causes.map(c => <option key={c}>{c}</option>)}</select>
        <button className="btn-primary">Search</button>
      </form>
      <p className="mt-6 text-sm text-muted">{plural(list.length, 'opportunity', 'opportunities')}</p>
      {list.length ? (
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {list.map(o => (
            <li key={o.id}>
              <Link href={`/opportunities/${o.id}`} className="grid gap-2 py-5 hover:bg-paper sm:grid-cols-[140px_1fr_auto] sm:gap-6 sm:px-3">
                <div className="text-sm"><p className="font-semibold">{fmtDate(o.starts_at, { weekday: 'short', month: 'short', day: 'numeric' })}</p><p className="text-muted">{fmtTime(o.starts_at)}</p></div>
                <div className="min-w-0"><p className="text-sm text-muted">{o.organization} · {o.category}</p><p className="mt-0.5 text-lg font-semibold leading-snug">{o.title}</p><p className="mt-1 text-sm text-ink/70">{o.remote ? 'Online' : o.location}</p></div>
                <p className="self-center text-sm">{o.spots_left > 0 ? <><b className="font-semibold">{o.spots_left}</b> spots left</> : <span className="text-muted">Full</span>}</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="panel mt-3 p-6 text-ink/75">Nothing matches that search. <Link href="/opportunities" className="link">Clear filters</Link></div>
      )}
    </div>
  )
}
