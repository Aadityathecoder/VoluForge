import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/server'
import { ProjectCard, type DashboardProjectRow } from '@/components/dashboard/ProjectCard'
import { guestProjects, isGuestMode } from '@/lib/guest'

export default async function DashboardProjectsPage() {
  const supabase = await createServerComponentClient()
  const guestMode = await isGuestMode()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user && !guestMode) redirect('/auth/login?next=/dashboard/projects')

  if (!user && guestMode) return <div className="min-h-screen pb-16"><div className="container-max py-10"><div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="mb-1 text-3xl font-bold text-slate-50">Guest projects</h1><p className="text-sm text-slate-400">Demo access is enabled. Project data is sample content.</p></div><Link href="/dashboard" className="btn-secondary self-start text-sm">← Dashboard</Link></div><div className="max-w-3xl space-y-4">{guestProjects.map((project) => <ProjectCard key={project.id} project={project} />)}</div></div></div>

  const uid = user.id
  const [{ data: ownedRows }, { data: fellowshipRows }] = await Promise.all([
    supabase.from('projects').select('id,title,status,end_date').or(`student_lead_id.eq.${uid},advisor_id.eq.${uid},community_partner_id.eq.${uid}`).order('updated_at', { ascending: false }),
    supabase.from('fellowship_projects').select('project_id'),
  ])
  const linkedIds = (fellowshipRows ?? []).map((row: any) => row.project_id)
  const { data: sharedRows } = linkedIds.length ? await supabase.from('projects').select('id,title,status,end_date').in('id', linkedIds) : { data: [] }
  const uniqueRows = new Map<string, any>()
  for (const row of [...(ownedRows ?? []), ...(sharedRows ?? [])]) uniqueRows.set(row.id, row)
  const projects: DashboardProjectRow[] = [...uniqueRows.values()].map((p: any) => ({ id: p.id, title: p.title, status: p.status as DashboardProjectRow['status'], end_date: p.end_date }))

  return <div className="min-h-screen pb-16"><div className="container-max py-10"><div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-3xl font-bold text-slate-50">Your projects</h1><p className="text-sm text-slate-400">Projects where you lead, advise, partner, or collaborate through a fellowship.</p></div><Link href="/dashboard" className="btn-secondary self-start text-sm">← Dashboard</Link></div><div className="max-w-3xl space-y-4">{projects.length ? projects.map((project) => <ProjectCard key={project.id} project={project} />) : <div className="card p-10 text-center"><p className="mb-4 text-slate-300">You don’t have any projects yet.</p><Link href="/explore" className="btn-primary inline-flex">Browse community needs</Link></div>}</div></div></div>
}
