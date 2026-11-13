import type { Metadata } from 'next'
import { requireViewer } from '@/lib/viewer'
import { fellowshipDirectory, missingMigration } from '@/lib/data'
import { FellowshipRow, MigrationNotice } from '@/components/FellowshipBits'
import { Notice } from '@/components/Notice'

export const metadata: Metadata = { title: 'Fellowships' }
export default async function Fellowships({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  await requireViewer('student')
  const { code } = await searchParams
  const [{ rows, error }, plain] = await Promise.all([fellowshipDirectory(code), code ? fellowshipDirectory() : null])
  const codeMissed = Boolean(code && plain && !error && rows.length <= plain.rows.length)
  const open = rows.filter(f => f.status === 'open' && !f.my_status)
  const mine = rows.filter(f => f.my_status)
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
      <div className="space-y-10">
        <div>
          <h1 className="h-page">Fellowships</h1>
          <p className="mt-2 max-w-2xl text-ink/70">Fellowships are small cohorts run by a school or organization over several weeks. Administrators choose who joins.</p>
        </div>
        {missingMigration(error) && <MigrationNotice />}
        {codeMissed && <Notice tone="error">No private fellowship uses the code {code!.toUpperCase()}. Check it with your administrator. Public fellowships below don't need a code.</Notice>}
        {code && !codeMissed && !error && <Notice tone="success">Code accepted. The fellowship is listed below.</Notice>}
        <section aria-labelledby="open-h">
          <h2 id="open-h" className="h-section mb-4">Open for applications</h2>
          {open.length
            ? <ul className="panel divide-y divide-line overflow-hidden">{open.map(f => <FellowshipRow key={f.id} f={f} code={code} />)}</ul>
            : <p className="panel p-6 text-ink/70">No fellowships are open right now. If your school runs one, ask for its join code.</p>}
        </section>
        {mine.length > 0 && (
          <section aria-labelledby="mine-h">
            <h2 id="mine-h" className="h-section mb-4">Your applications</h2>
            <ul className="panel divide-y divide-line overflow-hidden">{mine.map(f => <FellowshipRow key={f.id} f={f} />)}</ul>
          </section>
        )}
      </div>
      <aside className="lg:pt-20">
        <form className="panel p-5 lg:sticky lg:top-24">
          <h2 className="font-semibold">Have a join code?</h2>
          <p className="mt-1 text-sm text-muted">Your teacher or coordinator can share an 8-character code for their fellowship.</p>
          <label htmlFor="code" className="sr-only">Join code</label>
          <input id="code" name="code" defaultValue={code} placeholder="e.g. 4F9A21C7" maxLength={8} className="field mt-4 font-mono uppercase tracking-widest" />
          <button className="btn-primary mt-3 w-full">Find fellowship</button>
        </form>
      </aside>
    </div>
  )
}
