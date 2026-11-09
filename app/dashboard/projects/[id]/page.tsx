import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/server'
import { guestProjects, isGuestMode } from '@/lib/guest'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerComponentClient()
  const guestMode = await isGuestMode()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !guestMode) redirect(`/auth/login?next=/dashboard/projects/${id}`)
  if (!user && guestMode) {
    const project = guestProjects.find((item) => item.id === id)
    if (!project) notFound()
    return <div className="min-h-screen pb-16"><div className="container-max max-w-3xl py-10"><Link href="/dashboard/projects" className="mb-6 inline-block text-sm text-orange-400 hover:text-orange-300">← All projects</Link><div className="card p-8"><p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Guest preview</p><h1 className="mb-4 text-2xl font-bold text-slate-50">{project.title}</h1><div className="mb-6 flex flex-wrap gap-3"><span className="badge badge-neutral capitalize">{project.status}</span></div><p className="mb-6 text-sm leading-relaxed text-slate-400">Guest mode lets you explore the dashboard flow without signing in. Create an account later to save real projects, tasks, and reports.</p><Link href="/auth/signup" className="btn-secondary text-sm">Create a full account</Link></div></div></div>
  }

  const { data: project, error } = await supabase.from('projects').select('*').eq('id', id).maybeSingle()
  if (error || !project) notFound()
  const { data: sharedLinks } = await supabase.from('fellowship_projects').select('fellowship_id').eq('project_id', id).limit(1)
  const allowed = project.student_lead_id === user.id || project.advisor_id === user.id || project.community_partner_id === user.id || Boolean(sharedLinks?.length)
  if (!allowed) notFound()

  return <div className="min-h-screen pb-16"><div className="container-max max-w-3xl py-10"><Link href="/dashboard/projects" className="mb-6 inline-block text-sm text-orange-400 hover:text-orange-300">← All projects</Link><div className="card p-8"><p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Project</p><h1 className="mb-4 text-2xl font-bold text-slate-50">{project.title}</h1><div className="mb-6 flex flex-wrap gap-3"><span className="badge badge-neutral capitalize">{project.status}</span></div><p className="mb-6 text-sm leading-relaxed text-slate-400">This project is part of your fellowship’s shared mission. Coordinate with your cohort and partner as you move the work forward.</p><Link href="/dashboard" className="btn-secondary text-sm">Back to dashboard</Link></div></div></div>
}
