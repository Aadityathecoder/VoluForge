'use client'

import Link from 'next/link'
import { ArrowRight, Plus, Zap, Users, BarChart3, Clock } from 'lucide-react'
import { ProjectCard, type DashboardProjectRow } from '@/components/dashboard/ProjectCard'
import { DashboardSection } from '@/components/dashboard/DashboardSection'
import { formatDate } from '@/lib/utils'
import type { CommunityNeed } from '@/types/database'

type UpcomingTask = { title: string; due_date: string | null }

export function DashboardClient({
  displayName,
  projects,
  suggestedNeeds,
  upcomingTasks,
  activeCount,
}: {
  displayName: string
  projects: DashboardProjectRow[]
  suggestedNeeds: CommunityNeed[]
  upcomingTasks: UpcomingTask[]
  activeCount: number
}) {
  const planningCount = projects.filter((p) => p.status === 'planning').length

  return (
    <div className="min-h-screen pb-16">
      <div className="container-max py-10">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-50 mb-2">
            Welcome back{displayName ? `, ${displayName}` : ''}
          </h1>
          <p className="text-slate-400">Here&apos;s an overview of your projects and local needs.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Your projects', value: String(projects.length), icon: Zap },
            { label: 'Active', value: String(activeCount), icon: Users },
            { label: 'In planning', value: String(planningCount), icon: Clock },
            {
              label: 'Open needs (browse)',
              value: String(suggestedNeeds.length),
              icon: BarChart3,
            },
          ].map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="card p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-50 tabular-nums">{stat.value}</p>
                  </div>
                  <Icon className="w-8 h-8 text-orange-400/50" />
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <DashboardSection
              title="Your projects"
              action={
                <Link
                  href="/dashboard/projects"
                  className="text-sm font-medium text-orange-400 hover:text-orange-300"
                >
                  View all →
                </Link>
              }
            >
              <div className="space-y-4">
                {projects.length > 0 ? (
                  projects.map((project) => <ProjectCard key={project.id} project={project} />)
                ) : (
                  <div className="empty-state py-8">
                    <div className="empty-state-title">No projects yet</div>
                    <p className="empty-state-description">
                      Browse open community needs and generate a project kit to get started.
                    </p>
                    <Link href="/explore" className="btn-primary">
                      Browse community needs
                    </Link>
                  </div>
                )}
              </div>
            </DashboardSection>

            <DashboardSection
              title="Open community needs"
              action={
                <Link href="/explore" className="text-sm font-medium text-orange-400 hover:text-orange-300">
                  Browse all →
                </Link>
              }
            >
              <div className="space-y-3">
                {suggestedNeeds.length > 0 ? (
                  suggestedNeeds.map((need) => (
                    <div key={need.id} className="card-hover p-5 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-100 mb-1">{need.organization_name}</h4>
                        <p className="text-xs text-slate-500 mb-2 line-clamp-2">{need.description}</p>
                        <p className="text-sm font-medium text-orange-400/90">{need.category}</p>
                      </div>
                      <div className="shrink-0">
                        <span className="badge badge-neutral text-xs">{need.status}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 py-4">
                    No open needs match your visibility yet. Check back soon or invite a partner organization.
                  </p>
                )}
              </div>
            </DashboardSection>
          </div>

          <div className="space-y-4">
            <div className="card p-6">
              <h3 className="font-semibold text-slate-100 mb-4">Quick actions</h3>
              <div className="space-y-2">
                <Link
                  href="/explore"
                  className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-white/5 border border-transparent hover:border-white/10"
                >
                  <Plus className="w-5 h-5 text-orange-400" />
                  <span className="text-sm font-medium text-slate-200">Browse needs</span>
                  <ArrowRight className="w-4 h-4 text-slate-600 ml-auto" />
                </Link>
                <Link
                  href="/project-kits/new"
                  className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-white/5 border border-transparent hover:border-white/10"
                >
                  <Zap className="w-5 h-5 text-orange-400" />
                  <span className="text-sm font-medium text-slate-200">Create project kit</span>
                  <ArrowRight className="w-4 h-4 text-slate-600 ml-auto" />
                </Link>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-slate-100 mb-4">Upcoming tasks</h3>
              <div className="space-y-1">
                {upcomingTasks.length > 0 ? (
                  upcomingTasks.map((task) => (
                    <div
                      key={`${task.title}-${task.due_date}`}
                      className="flex items-start justify-between py-3 border-b border-white/5 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-200">{task.title}</p>
                        <p className="text-xs text-slate-500">
                          {task.due_date ? formatDate(task.due_date) : 'No due date'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 py-2">
                    No upcoming dated tasks. Add tasks inside a project to see them here.
                  </p>
                )}
              </div>
            </div>

            <div className="card p-6 border-orange-500/20 bg-orange-500/[0.07] shadow-glow-sm">
              <h3 className="font-semibold text-orange-100 mb-2">Need orientation?</h3>
              <p className="text-sm text-slate-400 mb-4">
                Review how VoluForge fits together—from needs to kits to execution.
              </p>
              <Link href="/how-it-works" className="text-sm font-medium text-orange-400 hover:text-orange-300">
                How it works →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
