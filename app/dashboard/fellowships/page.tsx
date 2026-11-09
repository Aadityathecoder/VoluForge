import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/server'
import { isGuestMode } from '@/lib/guest'
import { FellowshipNetwork, type Fellowship } from './FellowshipNetwork'

export default async function FellowshipsPage() {
  const supabase = await createServerComponentClient()
  const guestMode = await isGuestMode()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user && !guestMode) redirect('/auth/login?next=/dashboard/fellowships')

  let fellowships: Fellowship[] = []
  let setupPending = false
  if (user) {
    const { data, error } = await supabase.rpc('fellowship_network')
    if (error) setupPending = true
    else fellowships = (data ?? []) as Fellowship[]
  }

  return <div className="min-h-screen pb-16"><div className="container-max py-8 sm:py-10">
    <Link href="/dashboard" className="mb-6 inline-flex text-sm text-orange-400 hover:text-orange-300">← Dashboard</Link>
    <div className="mb-8"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-orange-300">People · squads · missions</p><h1 className="text-3xl font-bold text-slate-50 sm:text-4xl">Your fellowships</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Meet the people in your cohort, learn what they bring, and see the community projects your fellowship is taking on together.</p></div>
    <FellowshipNetwork fellowships={fellowships} setupPending={setupPending} />
  </div></div>
}
