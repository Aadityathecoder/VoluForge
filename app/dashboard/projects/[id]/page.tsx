import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/server'
import { guestProjects, isGuestMode } from '@/lib/guest'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerComponentClient()
  const guestMode = await isGuestMode()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && !guestMode) redirect(`/auth/login?next=/dashboard/projects/${id}`)

  if (!user && guestMode) {
    const project = guestProjects.find((item) => item.id === id)
    if (!project) notFound()

    return (
      <div className="min-h-screen pb-16">
        <div className="container-max max-w-3xl py-10">
          <Link href="/dashboard/projects" className="mb-6 inline-block text-sm text-orange-400 hover:text-orange-300">
            ← All projects
          </Link>
          <div className="card p-8">
            <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Guest preview</p>
            <h1 className="mb-4 text-2xl font-bold text-slate-50">{project.title}</h1>
            <div className="mb-6 flex flex-wrap gap-3">
              <span className="badge badge-neutral capitalize">{project.status}</span>
            </div>
            <p className="mb-6 text-sm leading-relaxed text-slate-400">
              Guest mode lets you explore the dashboard flow without signing in. Create an account later to save real
              projects, tasks, and reports.
            </p>
            <Link href="/auth/signup" className="btn-secondary text-sm">
              Create a full account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error || !project) notFound()

  const allowed =
    project.student_lead_id === user.id ||
    project.advisor_id === user.id ||
    project.community_partner_id === user.id

  if (!allowed) notFound()

  return (
    <div className="min-h-screen pb-16">
      <div className="container-max py-10 max-w-3xl">
        <Link href="/dashboard/projects" className="text-sm text-orange-400 hover:text-orange-300 mb-6 inline-block">
          ← All projects
        </Link>
        <div className="card p-8">
          <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Project</p>
          <h1 className="text-2xl font-bold text-slate-50 mb-4">{project.title}</h1>
          <div className="flex flex-wrap gap-3 mb-6">
            <span className="badge badge-neutral capitalize">{project.status}</span>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Execution boards, task assignment, and impact reporting views can extend this page. Your role-based access is
            enforced by Supabase RLS.
          </p>
          <Link href="/dashboard" className="btn-secondary text-sm">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
