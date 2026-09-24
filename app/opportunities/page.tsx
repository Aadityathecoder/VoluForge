import { createServerComponentClient } from '@/lib/supabase/server'
import { OpportunityFilters } from './OpportunityFilters'
import { opportunitySelect, type Opportunity } from './types'

export const dynamic = 'force-dynamic'

export default async function OpportunitiesPage() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const supabase = await createServerComponentClient()
  const { data, error } = configured
    ? await supabase.from('volunteer_opportunities').select(opportunitySelect)
      .eq('status', 'open').order('created_at', { ascending: false })
    : { data: null, error: null }

  return <main className="container-max py-10 md:py-14">
    <p className="text-sm font-semibold uppercase tracking-widest text-sky-500">Student service</p>
    <h1 className="theme-strong-text mt-3 text-3xl font-bold md:text-4xl">Find an opportunity</h1>
    <p className="theme-soft-text mb-8 mt-3 max-w-2xl">Explore open service roles by cause, skill, and format. Listings marked Demo are fictional examples for the pilot.</p>
    {!configured ? <div className="card p-6" role="status">Connect Supabase and run the discovery migration to load opportunities.</div>
      : error ? <div className="card p-6" role="alert">Opportunities could not be loaded. Check the migration and try refreshing this page.</div>
      : (data ?? []).length === 0 ? <div className="card p-6" role="status">No open opportunities yet. Check back after a nonprofit publishes one.</div>
      : <OpportunityFilters opportunities={data as unknown as Opportunity[]} />}
  </main>
}
