'use client'

import Link from 'next/link'
import { ArrowRight, BarChart3, Clock, HandHeart, Plus, Users, Zap } from 'lucide-react'
import { ProjectCard, type DashboardProjectRow } from '@/components/dashboard/ProjectCard'
import { DashboardSection } from '@/components/dashboard/DashboardSection'
import { formatDate } from '@/lib/utils'
import type { CommunityNeed } from '@/types/database'

type UpcomingTask = { title: string; due_date: string | null }
type Analytics = { tasksCompleted: number; tasksTotal: number; hoursReported: number; peopleServed: number }

export function DashboardClient({
  displayName,
  projects,
  suggestedNeeds,
  upcomingTasks,
  activeCount,
  analytics,
  fellowshipCount,
}: {
  displayName: string
  projects: DashboardProjectRow[]
  suggestedNeeds: CommunityNeed[]
  upcomingTasks: UpcomingTask[]
  activeCount: number
  analytics: Analytics
  fellowshipCount: number
}) {
  const planningCount = projects.filter((p) => p.status === 'planning').length
  const stats = [
    { label: 'Projects moving', value: String(activeCount), icon: Zap },
    { label: 'Tasks completed', value: `${analytics.tasksCompleted}/${analytics.tasksTotal}`, icon: Clock },
    { label: 'People served*', value: String(analytics.peopleServed), icon: HandHeart },
    { label: 'Fellowships', value: String(fellowshipCount), icon: Users },
  ]

  return (
    <div className="min-h-screen pb-16">
      <div className="container-max py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-slate-50 md:text-4xl">Welcome back{displayName ? `, ${displayName}` : ''}</h1>
            <p className="text-slate-400">A clear view of the work your team is moving forward.</p>
          </div>
          <Link href="/dashboard/fellowships" className="btn-secondary self-start text-sm">Meet your fellowship <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </div>

        <section aria-label="Project analytics" className="mb-10">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon
              return <div key={stat.label} className="card p-4 sm:p-5"><div className="flex items-start justify-between gap-2"><div><p className="mb-1 text-xs text-slate-500">{stat.label}</p><p className="text-2xl font-bold tabular-nums text-slate-50 sm:text-3xl">{stat.value}</p></div><Icon aria-hidden="true" className="h-6 w-6 shrink-0 text-orange-400/55" /></div></div>
            })}
          </div>
          <p className="mt-3 text-xs text-slate-500">*Partner-reported outcomes. Hours: {analytics.hoursReported.toFixed(1)} reported across your projects. Reports are not independently verified by this dashboard.</p>
        </section>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <DashboardSection title="Your projects" action={<Link href="/dashboard/projects" className="text-sm font-medium text-orange-400 hover:text-orange-300">View all →</Link>}>
              <div className="space-y-4">{projects.length ? projects.map((project) => <ProjectCard key={project.id} project={project} />) : <div className="empty-state py-8"><div className="empty-state-title">No projects yet</div><p className="empty-state-description">Browse open community needs and make a project plan with your team.</p><Link href="/explore" className="btn-primary">Browse community needs</Link></div>}</div>
            </DashboardSection>

            <DashboardSection title="Open community needs" action={<Link href="/explore" className="text-sm font-medium text-orange-400 hover:text-orange-300">Browse all →</Link>}>
              <div className="space-y-3">{suggestedNeeds.length ? suggestedNeeds.map((need) => <div key={need.id} className="card-hover flex items-start justify-between gap-4 p-5"><div className="min-w-0 flex-1"><h4 className="mb-1 font-semibold text-slate-100">{need.organization_name}</h4><p className="mb-2 line-clamp-2 text-xs text-slate-500">{need.description}</p><p className="text-sm font-medium text-orange-400/90">{need.category}</p></div><span className="badge badge-neutral shrink-0 text-xs">{need.status}</span></div>) : <p className="py-4 text-sm text-slate-500">No open needs match your visibility yet. Check back soon or invite a partner organization.</p>}</div>
            </DashboardSection>
          </div>

          <aside className="space-y-4">
            <div className="card p-6"><h3 className="mb-4 font-semibold text-slate-100">Quick actions</h3><div className="space-y-2">
              <Link href="/explore" className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:border-white/10 hover:bg-white/5"><Plus className="h-5 w-5 text-orange-400" /><span className="text-sm font-medium text-slate-200">Browse needs</span><ArrowRight className="ml-auto h-4 w-4 text-slate-600" /></Link>
              <Link href="/project-kits/new" className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:border-white/10 hover:bg-white/5"><Zap className="h-5 w-5 text-orange-400" /><span className="text-sm font-medium text-slate-200">Plan a project</span><ArrowRight className="ml-auto h-4 w-4 text-slate-600" /></Link>
              <Link href="/dashboard/fellowships" className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:border-white/10 hover:bg-white/5"><Users className="h-5 w-5 text-orange-400" /><span className="text-sm font-medium text-slate-200">Find your cohort</span><ArrowRight className="ml-auto h-4 w-4 text-slate-600" /></Link>
            </div></div>

            <div className="card p-6"><div className="mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-orange-400" /><h3 className="font-semibold text-slate-100">Tasks coming up</h3></div><div className="space-y-1">{upcomingTasks.length ? upcomingTasks.map((task) => <div key={`${task.title}-${task.due_date}`} className="flex items-start justify-between border-b border-white/5 py-3 last:border-0"><div><p className="text-sm font-medium text-slate-200">{task.title}</p><p className="text-xs text-slate-500">{task.due_date ? formatDate(task.due_date) : 'No due date'}</p></div></div>) : <p className="py-2 text-sm text-slate-500">No upcoming dated tasks. Add tasks inside a project to see them here.</p>}</div></div>

            <div className="card border-orange-500/20 bg-orange-500/[0.07] p-6 shadow-glow-sm"><h3 className="mb-2 font-semibold text-orange-100">Need orientation?</h3><p className="mb-4 text-sm text-slate-400">See how needs become missions, teams, and measurable outcomes.</p><Link href="/how-it-works" className="text-sm font-medium text-orange-400 hover:text-orange-300">How it works →</Link></div>
          </aside>
        </div>
      </div>
    </div>
  )
}
