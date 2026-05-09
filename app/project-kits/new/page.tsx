import { Suspense } from 'react'
import { Loader } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/server'
import { NewProjectKitClient } from './NewProjectKitClient'
import { guestNeeds, isGuestMode } from '@/lib/guest'

export default async function NewProjectKitPage({
  searchParams,
}: {
  searchParams: Promise<{ need?: string }>
}) {
  const sp = await searchParams
  const supabase = await createServerComponentClient()
  const guestMode = await isGuestMode()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    if (!guestMode) {
      redirect(`/auth/login?next=/project-kits/new${sp.need ? `?need=${sp.need}` : ''}`)
    }

    return (
      <Suspense
        fallback={
          <div className="min-h-[50vh] flex items-center justify-center gap-3 text-slate-400">
            <Loader className="w-5 h-5 animate-spin text-orange-400" />
            Loading…
          </div>
        }
      >
        <NewProjectKitClient initialNeeds={guestNeeds} initialNeedId={sp.need ?? guestNeeds[0]?.id ?? null} />
      </Suspense>
    )
  }

  const { data: needs } = await supabase
    .from('community_needs')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center gap-3 text-slate-400">
          <Loader className="w-5 h-5 animate-spin text-orange-400" />
          Loading…
        </div>
      }
    >
      <NewProjectKitClient initialNeeds={needs ?? []} initialNeedId={sp.need ?? null} />
    </Suspense>
  )
}
