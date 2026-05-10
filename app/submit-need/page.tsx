import Link from 'next/link'
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
    return (
      <div className="container-max py-16 max-w-xl">
        <div className="card p-8 border-amber-500/20">
          <h1 className="text-xl font-semibold text-slate-50 mb-3">Finish setting up your account</h1>
          <p className="text-slate-400 leading-relaxed mb-6">
            Your profile is not ready yet. If you just signed up, confirm your email. Make sure the Supabase trigger{' '}
            <code className="text-orange-300 text-sm">handle_new_user</code> is installed so a profile row is created.
          </p>
          <Link href="/dashboard" className="btn-secondary text-sm">
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (profile.role !== 'partner') {
    return <SubmitNeedClient defaultContactName={profile.full_name ?? ''} demoMode />
  }

  return <SubmitNeedClient defaultContactName={profile.full_name ?? ''} />
}
