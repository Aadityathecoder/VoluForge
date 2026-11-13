import Link from 'next/link'
import type { Fellowship } from '@/lib/data'
import { fmtDate, fmtRange, plural } from '@/lib/format'

const statusTone: Record<string, string> = {
  pending: 'bg-peach text-ink', accepted: 'bg-sage text-forest', declined: 'bg-soft text-muted', withdrawn: 'bg-soft text-muted',
  open: 'bg-sage text-forest', draft: 'bg-soft text-ink', closed: 'bg-soft text-muted',
}
const statusLabel: Record<string, string> = {
  pending: 'Waiting for review', accepted: 'Accepted', declined: 'Not accepted', withdrawn: 'Withdrawn', open: 'Open', draft: 'Draft', closed: 'Closed',
}
export function Status({ value }: { value: string }) {
  return <span className={`tag ${statusTone[value] ?? 'bg-soft'}`}>{statusLabel[value] ?? value}</span>
}

export function FellowshipRow({ f, code }: { f: Fellowship; code?: string }) {
  return (
    <li>
      <Link href={`/fellowships/${f.id}${code ? `?code=${encodeURIComponent(code)}` : ''}`} className="group grid gap-x-8 gap-y-2 px-5 py-5 hover:bg-cream sm:grid-cols-[1fr_auto] sm:px-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted">{f.host}</span>
            {f.my_status && <Status value={f.my_status} />}
          </div>
          <h3 className="mt-1 font-display text-xl font-bold tracking-[-0.01em] group-hover:text-forest">{f.title}</h3>
          {f.summary && <p className="mt-1 max-w-2xl text-[15px] text-ink/70">{f.summary}</p>}
          <p className="mt-2 text-sm text-ink/70">{fmtRange(f.starts_on, f.ends_on)} · {plural(f.weekly_hours, 'hour')} a week · {f.remote ? 'Online' : f.location || 'In person'}</p>
        </div>
        <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:justify-center sm:gap-1 sm:text-right">
          <span className="text-sm"><b className="font-semibold">{plural(f.seats_left, 'seat')}</b> left</span>
          {f.apply_by && f.status === 'open' && <span className="text-sm font-medium text-ember-dark">Apply by {fmtDate(f.apply_by, { month: 'short', day: 'numeric' })}</span>}
          {f.status !== 'open' && <Status value={f.status} />}
        </div>
      </Link>
    </li>
  )
}

export function MigrationNotice() {
  return (
    <p className="rounded-md border border-ember/30 bg-peach/50 px-4 py-3 text-sm">
      Fellowships aren't switched on for this site yet. An operator needs to apply the database update <code className="font-mono text-[13px]">202611130001_admin_fellowships.sql</code>.
    </p>
  )
}
