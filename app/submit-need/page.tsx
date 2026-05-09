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

    return (
      <div className="container-max max-w-xl py-16">
        <div className="card p-8">
          <h1 className="mb-3 text-xl font-semibold text-slate-50">Guest mode is browse-only here</h1>
          <p className="mb-6 leading-relaxed text-slate-400">
            You can explore the dashboard and project flows as a guest, but submitting a real community need requires a
            signed-in partner account.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard" className="btn-secondary text-sm">
              View dashboard
            </Link>
            <Link href="/auth/signup" className="btn-primary text-sm">
              Create partner account
            </Link>
          </div>
        </div>
      </div>
    )
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
    return (
      <div className="container-max py-16 max-w-xl">
        <div className="card p-8">
          <h1 className="text-xl font-semibold text-slate-50 mb-3">Community partners only</h1>
          <p className="text-slate-400 leading-relaxed mb-6">
            Submitting a community need is limited to accounts registered as <strong className="text-slate-200">community partners</strong>.
            Student and advisor accounts can browse needs and build project kits instead.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/explore" className="btn-primary text-sm">
              Browse needs
            </Link>
            <Link href="/dashboard" className="btn-secondary text-sm">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <SubmitNeedClient defaultContactName={profile.full_name ?? ''} />
}
