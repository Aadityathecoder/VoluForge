import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/server'
import { opportunitySelect, type Opportunity } from '../types'

export const dynamic = 'force-dynamic'

export default async function OpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) notFound()
  const supabase = await createServerComponentClient()
  const { data, error } = await supabase.from('volunteer_opportunities')
    .select(opportunitySelect).eq('id', id).eq('status', 'open').maybeSingle()

  if (error) return <main className="container-max py-14" role="alert">
    <h1 className="theme-strong-text text-2xl font-semibold">Unable to load this opportunity</h1>
    <p className="theme-soft-text mt-3">Please refresh the page and try again.</p>
  </main>
  if (!data) notFound()
  const item = data as unknown as Opportunity

  return <main className="container-max max-w-4xl py-10 md:py-14">
    <Link href="/opportunities" className="text-sm font-medium text-sky-500 hover:underline">← All opportunities</Link>
    <article className="card mt-7 p-7 md:p-10">
      <p className="text-sm font-semibold uppercase tracking-wider text-sky-500">{item.cause} · {item.participation_mode.replace('_', ' ')}</p>
      <h1 className="theme-strong-text mt-3 text-3xl font-bold">{item.title}</h1>
      <p className="theme-soft-text mt-2">{item.volunteer_organizations.name}</p>
      {item.volunteer_organizations.is_demo && <p className="mt-5 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm theme-strong-text">
        Demo listing: This is a fictional example. Applications and service verification are not available for it.
      </p>}
      <h2 className="theme-strong-text mt-8 text-lg font-semibold">The work</h2>
      <p className="theme-soft-text mt-2 whitespace-pre-line leading-relaxed">{item.description}</p>
      <dl className="mt-8 grid gap-5 border-t border-white/10 pt-6 sm:grid-cols-2">
        <div><dt className="theme-soft-text text-sm">Commitment</dt><dd className="theme-strong-text mt-1">{item.time_commitment}</dd></div>
        <div><dt className="theme-soft-text text-sm">Location</dt><dd className="theme-strong-text mt-1">{item.location ?? 'Remote'}</dd></div>
        <div><dt className="theme-soft-text text-sm">Minimum age</dt><dd className="theme-strong-text mt-1">{item.minimum_age ?? 'Ask the nonprofit'}</dd></div>
        <div><dt className="theme-soft-text text-sm">Useful skills</dt><dd className="theme-strong-text mt-1">{item.skills.length ? item.skills.join(', ') : 'No specific skill required'}</dd></div>
      </dl>
      <p className="theme-soft-text mt-8 text-sm">Applications will be added in the next MVP slice.</p>
    </article>
  </main>
}
