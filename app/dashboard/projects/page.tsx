import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/server'
import { ProjectCard, type DashboardProjectRow } from '@/components/dashboard/ProjectCard'
import { guestProjects, isGuestMode } from '@/lib/guest'

export default async function DashboardProjectsPage() {
  const supabase = await createServerComponentClient()
  const guestMode = await isGuestMode()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && !guestMode) redirect('/auth/login?next=/dashboard/projects')

  if (!user && guestMode) {
    return (
      <div className="min-h-screen pb-16">
        <div className="container-max py-10">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="mb-1 text-3xl font-bold text-slate-50">Guest projects</h1>
              <p className="text-sm text-slate-400">Demo access is enabled. Project data is sample content.</p>
            </div>
            <Link href="/dashboard" className="btn-secondary text-sm self-start">
              ← Dashboard
            </Link>
          </div>

          <div className="max-w-3xl space-y-4">
            {guestProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const uid = user.id
  const { data: rows } = await supabase
    .from('projects')
    .select('id,title,status,end_date')
    .or(`student_lead_id.eq.${uid},advisor_id.eq.${uid},community_partner_id.eq.${uid}`)
    .order('updated_at', { ascending: false })

  const projects: DashboardProjectRow[] = (rows ?? []).map((p: any) => ({
    id: p.id,
    title: p.title,
    status: p.status as DashboardProjectRow['status'],
    end_date: p.end_date,
  }))

  return (
    <div className="min-h-screen pb-16">
      <div className="container-max py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-50 mb-1">Your projects</h1>
            <p className="text-slate-400 text-sm">Projects where you are lead, advisor, or partner.</p>
          </div>
          <Link href="/dashboard" className="btn-secondary text-sm self-start">
            ← Dashboard
          </Link>
        </div>

        <div className="space-y-4 max-w-3xl">
          {projects.length > 0 ? (
            projects.map((p) => <ProjectCard key={p.id} project={p} />)
          ) : (
            <div className="card p-10 text-center">
              <p className="text-slate-300 mb-4">You don&apos;t have any projects yet.</p>
              <Link href="/explore" className="btn-primary inline-flex">
                Browse community needs
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
