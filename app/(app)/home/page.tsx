import type { Metadata } from 'next'
import Link from 'next/link'
import { requireViewer } from '@/lib/viewer'
import { fellowshipDirectory, missingMigration, myApplications, opportunities } from '@/lib/data'
import { FellowshipRow, MigrationNotice } from '@/components/FellowshipBits'
import { fmtDate } from '@/lib/format'

export const metadata: Metadata = { title: 'Home' }
export default async function Home() {
  const viewer = await requireViewer('student')
  const [dir, opps, mine] = await Promise.all([fellowshipDirectory(), opportunities(), myApplications(viewer.id)])
  const joined = dir.rows.filter(f => f.my_status === 'accepted' || f.my_status === 'pending')
  const open = dir.rows.filter(f => !f.my_status && f.status === 'open').slice(0, 3)
  const first = viewer.fullName.split(' ')[0]
  const hours = (mine.approvedMinutes / 60).toFixed(1).replace(/\.0$/, '')
  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="h-page">{first ? `Welcome back, ${first}` : 'Welcome back'}</h1>
          <p className="mt-2 text-ink/70">Here's where your fellowships and applications stand.</p>
        </div>
        <dl className="flex gap-8 text-right">
          <div><dt className="text-sm text-muted">Approved hours</dt><dd className="font-display text-3xl font-bold tabular-nums">{hours}</dd></div>
          <div><dt className="text-sm text-muted">Applications</dt><dd className="font-display text-3xl font-bold tabular-nums">{mine.applications.length + joined.length}</dd></div>
        </dl>
      </div>

      {missingMigration(dir.error) && <MigrationNotice />}

      <section aria-labelledby="mine">
        <div className="mb-4 flex items-baseline justify-between"><h2 id="mine" className="h-section">Your fellowships</h2></div>
        {joined.length ? (
          <ul className="panel divide-y divide-line overflow-hidden">{joined.map(f => <FellowshipRow key={f.id} f={f} />)}</ul>
        ) : (
          <div className="panel flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-ink/75">You haven't applied to a fellowship yet. Browse open ones, or use a join code from your school.</p>
            <Link href="/fellowships" className="btn-primary shrink-0">Find a fellowship</Link>
          </div>
        )}
      </section>

      {open.length > 0 && (
        <section aria-labelledby="open">
          <div className="mb-4 flex items-baseline justify-between"><h2 id="open" className="h-section">Open fellowships</h2><Link href="/fellowships" className="link text-sm">See all</Link></div>
          <ul className="panel divide-y divide-line overflow-hidden">{open.map(f => <FellowshipRow key={f.id} f={f} />)}</ul>
        </section>
      )}

      <section aria-labelledby="opps">
        <div className="mb-4 flex items-baseline justify-between"><h2 id="opps" className="h-section">Volunteer this month</h2><Link href="/opportunities" className="link text-sm">All opportunities</Link></div>
        {opps.rows.length ? (
          <ul className="grid gap-4 md:grid-cols-3">
            {opps.rows.slice(0, 3).map(o => (
              <li key={o.id}><Link href={`/opportunities/${o.id}`} className="panel block h-full p-5 hover:border-ink/40">
                <p className="text-sm text-muted">{o.organization}</p>
                <p className="mt-1 font-semibold leading-snug">{o.title}</p>
                <p className="mt-3 text-sm text-ink/70">{fmtDate(o.starts_at, { weekday: 'short', month: 'short', day: 'numeric' })} · {o.remote ? 'Online' : o.location}</p>
              </Link></li>
            ))}
          </ul>
        ) : <p className="text-ink/70">No open volunteer shifts right now. Check back soon.</p>}
      </section>
    </div>
  )
}
