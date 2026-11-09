import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/server'
import { DashboardClient } from './DashboardClient'
import type { DashboardProjectRow } from '@/components/dashboard/ProjectCard'
import { guestNeeds, guestProjects, guestTasks, isGuestMode } from '@/lib/guest'

export default async function DashboardPage() {
  const supabase = await createServerComponentClient()
  const guestMode = await isGuestMode()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    if (!guestMode) redirect('/auth/login?next=/dashboard')
    return <DashboardClient displayName="Guest" projects={guestProjects} suggestedNeeds={guestNeeds} upcomingTasks={guestTasks} activeCount={guestProjects.filter((p) => p.status === 'active').length} analytics={{ tasksCompleted: 0, tasksTotal: guestTasks.length, hoursReported: 0, peopleServed: 0 }} fellowshipCount={0} />
  }

  const uid = user.id
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', uid).maybeSingle()
  const displayName = profile?.full_name?.trim() || user.email?.split('@')[0] || ''
  const { data: projectsRaw } = await supabase.from('projects').select('id,title,status,end_date').or(`student_lead_id.eq.${uid},advisor_id.eq.${uid},community_partner_id.eq.${uid}`).order('updated_at', { ascending: false })
  const projects: DashboardProjectRow[] = (projectsRaw ?? []).map((p: any) => ({ id: p.id, title: p.title, status: p.status as DashboardProjectRow['status'], end_date: p.end_date }))
  const projectIds = projects.map((p) => p.id)
  const activeCount = projects.filter((p) => p.status === 'active').length
  const { data: suggestedNeeds } = await supabase.from('community_needs').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(6)

  let upcomingTasks: { title: string; due_date: string | null }[] = []
  let analytics = { tasksCompleted: 0, tasksTotal: 0, hoursReported: 0, peopleServed: 0 }
  if (projectIds.length) {
    const [{ data: taskRows }, { data: reports }] = await Promise.all([
      supabase.from('project_tasks').select('title,due_date,status').in('project_id', projectIds),
      supabase.from('impact_reports').select('project_id,volunteer_hours,people_served,updated_at').in('project_id', projectIds).order('updated_at', { ascending: false }),
    ])
    const tasks = taskRows ?? []
    upcomingTasks = tasks.filter((task: any) => task.due_date).sort((a: any, b: any) => String(a.due_date).localeCompare(String(b.due_date))).slice(0, 6).map((task: any) => ({ title: task.title, due_date: task.due_date }))
    const latestReports = new Map<string, any>()
    for (const report of reports ?? []) if (!latestReports.has(report.project_id)) latestReports.set(report.project_id, report)
    analytics = {
      tasksCompleted: tasks.filter((task: any) => task.status === 'completed').length,
      tasksTotal: tasks.length,
      hoursReported: [...latestReports.values()].reduce((sum: number, report: any) => sum + Number(report.volunteer_hours ?? 0), 0),
      peopleServed: [...latestReports.values()].reduce((sum: number, report: any) => sum + Number(report.people_served ?? 0), 0),
    }
  }

  const { data: fellowshipRows } = await supabase.rpc('fellowship_network')
  return <DashboardClient displayName={displayName} projects={projects} suggestedNeeds={suggestedNeeds ?? []} upcomingTasks={upcomingTasks} activeCount={activeCount} analytics={analytics} fellowshipCount={fellowshipRows?.length ?? 0} />
}
