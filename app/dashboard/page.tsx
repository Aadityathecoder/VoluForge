import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/server'
import { DashboardClient } from './DashboardClient'
import type { DashboardProjectRow } from '@/components/dashboard/ProjectCard'
import { guestNeeds, guestProjects, guestTasks, isGuestMode } from '@/lib/guest'

export default async function DashboardPage() {
  const supabase = await createServerComponentClient()
  const guestMode = await isGuestMode()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    if (!guestMode) {
      redirect('/auth/login?next=/dashboard')
    }

    return (
      <DashboardClient
        displayName="Guest"
        projects={guestProjects}
        suggestedNeeds={guestNeeds}
        upcomingTasks={guestTasks}
        activeCount={guestProjects.filter((project) => project.status === 'active').length}
      />
    )
  }

  const uid = user.id

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()

  const displayName = profile?.full_name?.trim() || user.email?.split('@')[0] || ''

  const { data: projectsRaw } = await supabase
    .from('projects')
    .select('id,title,status,end_date')
    .or(`student_lead_id.eq.${uid},advisor_id.eq.${uid},community_partner_id.eq.${uid}`)
    .order('updated_at', { ascending: false })

  const projects: DashboardProjectRow[] = (projectsRaw ?? []).map((p: any) => ({
    id: p.id,
    title: p.title,
    status: p.status as DashboardProjectRow['status'],
    end_date: p.end_date,
  }))

  const activeCount = projects.filter((p) => p.status === 'active').length

  const { data: suggestedNeeds } = await supabase
    .from('community_needs')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(6)

  const projectIds = projects.map((p) => p.id)
  let upcomingTasks: { title: string; due_date: string | null }[] = []

  if (projectIds.length > 0) {
    const { data: tasks } = await supabase
      .from('project_tasks')
      .select('title, due_date')
      .in('project_id', projectIds)
      .not('due_date', 'is', null)
      .order('due_date', { ascending: true })
      .limit(6)
    upcomingTasks = (tasks ?? []).map((t: any) => ({ title: t.title, due_date: t.due_date }))
  }

  return (
    <DashboardClient
      displayName={displayName}
      projects={projects}
      suggestedNeeds={suggestedNeeds ?? []}
      upcomingTasks={upcomingTasks}
      activeCount={activeCount}
    />
  )
}
