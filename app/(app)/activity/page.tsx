import type { Metadata } from 'next'
import Link from 'next/link'
import { requireViewer } from '@/lib/viewer'
import { fellowshipDirectory, myApplications, opportunities } from '@/lib/data'
import { Status } from '@/components/FellowshipBits'
import { fmtDate } from '@/lib/format'

export const metadata: Metadata = { title: 'My activity' }
export default async function Activity() {
  const viewer = await requireViewer('student')
  const [dir, mine, opps] = await Promise.all([fellowshipDirectory(), myApplications(viewer.id), opportunities()])
  const fellowships = dir.rows.filter(f => f.my_status)
  const byId = new Map(opps.rows.map(o => [o.id, o]))
  const h = (m: number) => (m / 60).toFixed(1).replace(/\.0$/, '')
  return (
    <div className="space-y-12">
      <div>
        <h1 className="h-page">My activity</h1>
        <p className="mt-2 text-ink/70">Every application you've sent, and the hours organizers have approved.</p>
      </div>
      <dl className="grid max-w-xl grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line">
        <div className="bg-paper p-5"><dt className="text-sm text-muted">Approved hours</dt><dd className="mt-1 font-display text-4xl font-bold tabular-nums">{h(mine.approvedMinutes)}</dd></div>
        <div className="bg-paper p-5"><dt className="text-sm text-muted">Waiting for approval</dt><dd className="mt-1 font-display text-4xl font-bold tabular-nums text-ink/60">{h(mine.pendingMinutes)}</dd></div>
      </dl>
      <section>
        <h2 className="h-section mb-4">Fellowship applications</h2>
        {fellowships.length ? (
          <div className="overflow-x-auto rounded-lg border border-line bg-paper">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-line text-muted"><tr><th className="px-5 py-3 font-medium">Fellowship</th><th className="px-5 py-3 font-medium">Host</th><th className="px-5 py-3 font-medium">Starts</th><th className="px-5 py-3 font-medium">Status</th></tr></thead>
              <tbody className="divide-y divide-line">{fellowships.map(f => (
                <tr key={f.id}><td className="px-5 py-3.5"><Link href={`/fellowships/${f.id}`} className="font-semibold hover:text-forest">{f.title}</Link></td><td className="px-5 py-3.5 text-ink/75">{f.host}</td><td className="px-5 py-3.5 tabular-nums">{fmtDate(f.starts_on)}</td><td className="px-5 py-3.5"><Status value={f.my_status!} /></td></tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="text-ink/70">None yet. <Link href="/fellowships" className="link">Browse fellowships</Link></p>}
      </section>
      <section>
        <h2 className="h-section mb-4">Volunteer applications</h2>
        {mine.applications.length ? (
          <div className="overflow-x-auto rounded-lg border border-line bg-paper">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-line text-muted"><tr><th className="px-5 py-3 font-medium">Opportunity</th><th className="px-5 py-3 font-medium">Applied</th><th className="px-5 py-3 font-medium">Status</th></tr></thead>
              <tbody className="divide-y divide-line">{mine.applications.map(a => (
                <tr key={a.id}><td className="px-5 py-3.5">{byId.get(a.opportunity_id) ? <Link href={`/opportunities/${a.opportunity_id}`} className="font-semibold hover:text-forest">{byId.get(a.opportunity_id)!.title}</Link> : <span className="text-muted">Past opportunity</span>}</td><td className="px-5 py-3.5 tabular-nums">{fmtDate(a.created_at)}</td><td className="px-5 py-3.5"><Status value={a.status} /></td></tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="text-ink/70">None yet. <Link href="/opportunities" className="link">Find an opportunity</Link></p>}
        <p className="mt-4 text-sm text-muted">Log service hours and attach proof from the VoluForge mobile app.</p>
      </section>
    </div>
  )
}
