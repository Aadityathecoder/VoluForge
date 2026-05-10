import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/server'
import { SubmitNeedClient } from './SubmitNeedClient'

export default async function SubmitNeedPage() {
  const supabase = await createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth/login?next=/submit-need`)
  }

  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).maybeSingle()

  if (!profile) {
    return (
      <div className="container-max py-16 max-w-xl">
        <div className="card p-8 border-amber-500/20">
          <h1 className="text-xl font-semibold text-slate-50 mb-3">Partner profile required</h1>
          <p className="text-slate-400 leading-relaxed mb-6">
            Publishing a community need now requires a real partner profile. Finish connecting your account in
            Supabase, then come back here to submit the need with item recognition and image upload.
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
            Students and advisors can explore needs and build project kits, but only partner accounts can publish new
            needs for public use.
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
