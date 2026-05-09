import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import type { ProjectStatus } from '@/types/database'

export type DashboardProjectRow = {
  id: string
  title: string
  status: ProjectStatus
  end_date: string | null
}

function progressFromStatus(status: ProjectStatus): number {
  switch (status) {
    case 'completed':
      return 100
    case 'active':
      return 65
    case 'planning':
      return 30
    case 'paused':
      return 45
    default:
      return 0
  }
}

export function ProjectCard({ project }: { project: DashboardProjectRow }) {
  const statusLabel =
    project.status === 'active'
      ? 'Active'
      : project.status === 'planning'
        ? 'Planning'
        : project.status === 'completed'
          ? 'Completed'
          : 'Paused'

  const progress = progressFromStatus(project.status)
  const deadline = project.end_date

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-semibold text-slate-100 mb-1">{project.title}</h3>
          <p className="text-sm text-slate-500">
            {deadline ? `Target end ${formatDate(deadline)}` : 'End date not set'}
          </p>
        </div>
        <span
          className={`badge text-xs shrink-0 ${
            project.status === 'active'
              ? 'badge-success'
              : project.status === 'planning'
                ? 'badge-warning'
                : 'badge-neutral'
          }`}
        >
          {statusLabel}
        </span>
      </div>
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-800/80 overflow-hidden border border-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 shadow-glow-sm transition-all"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>
      <Link
        href={`/dashboard/projects/${project.id}`}
        className="text-sm font-medium text-orange-400 hover:text-orange-300 transition-colors"
      >
        View project →
      </Link>
    </div>
  )
}
