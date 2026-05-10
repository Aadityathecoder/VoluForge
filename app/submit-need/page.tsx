import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/server'
import { SubmitNeedClient } from './SubmitNeedClient'
import { isGuestMode } from '@/lib/guest'

export default async function SubmitNeedPage() {
  const supabase = await createServerComponentClient()
  const guestMode = await isGuestMode()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    if (!guestMode) {
      redirect(`/auth/login?next=/submit-need`)
    }

    return <SubmitNeedClient defaultContactName="Guest demo" demoMode />
  }

  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).maybeSingle()

  if (!profile) {
    return <SubmitNeedClient defaultContactName={user.email?.split('@')[0] ?? 'User'} demoMode />
  }

  if (profile.role !== 'partner') {
    return <SubmitNeedClient defaultContactName={profile.full_name ?? ''} demoMode />
  }

  return <SubmitNeedClient defaultContactName={profile.full_name ?? ''} />
}
