import type { Metadata } from 'next'
import Link from 'next/link'
import { requireViewer } from '@/lib/viewer'
import { createClient } from '@/lib/supabase/server'
import { missingMigration, type AdminFellowship } from '@/lib/data'
import { MigrationNotice, Status } from '@/components/FellowshipBits'
import { Notice } from '@/components/Notice'
import { fmtDate } from '@/lib/format'

export const metadata: Metadata = { title: 'Your fellowships' }
export default async function Admin({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const viewer = await requireViewer('admin')
  const { deleted } = await searchParams
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('vf_admin_fellowships')
  const rows = (data ?? []) as AdminFellowship[]
  const pending = rows.reduce((n, r) => n + r.pending, 0)
  const fellows = rows.reduce((n, r) => n + r.accepted, 0)
  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-muted">{viewer.organization || 'Administrator'}</p>
          <h1 className="h-page mt-1">Your fellowships</h1>
        </div>
        <Link href="/admin/fellowships/new" className="btn-ember">New fellowship</Link>
      </div>
      {missingMigration(error) && <MigrationNotice />}
      {deleted && <Notice>Fellowship deleted.</Notice>}
      {!viewer.verified && !error && (
        <Notice>Your account isn't verified yet, so your fellowships don't appear in the public list. Students can still find and apply to an open fellowship with its join code. Contact support to get verified.</Notice>
      )}
      <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-line bg-line sm:max-w-2xl">
        {[['Fellowships', rows.length], ['Waiting for review', pending], ['Accepted fellows', fellows]].map(([k, v]) => (
          <div key={k} className="bg-paper p-5"><dt className="text-sm text-muted">{k}</dt><dd className={`mt-1 font-display text-3xl font-bold tabular-nums ${k === 'Waiting for review' && Number(v) > 0 ? 'text-ember-dark' : ''}`}>{v}</dd></div>
        ))}
      </dl>
      {rows.length ? (
        <div className="overflow-x-auto rounded-lg border border-line bg-paper">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-muted"><tr>
              <th className="px-5 py-3 font-medium">Fellowship</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Runs</th>
              <th className="px-5 py-3 text-right font-medium">Seats filled</th><th className="px-5 py-3 text-right font-medium">To review</th><th className="px-5 py-3 font-medium">Join code</th>
            </tr></thead>
            <tbody className="divide-y divide-line">{rows.map(r => (
              <tr key={r.id} className="hover:bg-cream">
                <td className="px-5 py-4"><Link href={`/admin/fellowships/${r.id}`} className="font-semibold hover:text-forest">{r.title}</Link><p className="text-muted">{r.focus}</p></td>
                <td className="px-5 py-4"><Status value={r.status} /></td>
                <td className="px-5 py-4 tabular-nums">{fmtDate(r.starts_on, { month: 'short', day: 'numeric' })} – {fmtDate(r.ends_on, { month: 'short', day: 'numeric' })}</td>
                <td className="px-5 py-4 text-right tabular-nums">{r.accepted} / {r.capacity}</td>
                <td className="px-5 py-4 text-right tabular-nums">{r.pending > 0 ? <Link href={`/admin/fellowships/${r.id}#roster`} className="font-semibold text-ember-dark hover:underline">{r.pending}</Link> : <span className="text-muted">0</span>}</td>
                <td className="px-5 py-4 font-mono tracking-wider">{r.join_code}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : !error && (
        <div className="rounded-lg border border-dashed border-ink/30 p-10 text-center">
          <p className="font-display text-2xl font-bold">Create your first fellowship</p>
          <p className="mx-auto mt-2 max-w-md text-ink/70">Students can't join a fellowship until an administrator creates one. Set it up in a couple of minutes, then share the join code.</p>
          <Link href="/admin/fellowships/new" className="btn-primary mt-6">New fellowship</Link>
        </div>
      )}
    </div>
  )
}
