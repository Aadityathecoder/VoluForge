'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Edit2, Download, Play } from 'lucide-react'
import type { ProjectKitAIResponse } from '@/types/projectKit'

function sectionSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

interface ProjectKitDisplayProps {
  kit: ProjectKitAIResponse
  needId?: string
}

export function ProjectKitDisplay({ kit, needId }: ProjectKitDisplayProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null)

  const handleEdit = (section: string) => {
    setEditingSection(section)
  }

  const durationSummary =
    kit.timeline.length > 0 ? kit.timeline.map((p) => p.duration).join(' · ') : '—'
  const rolesSummary =
    kit.volunteerRoles.length > 0 ? `${kit.volunteerRoles.length} defined roles` : '—'

  return (
    <div className="min-h-screen pb-16">
      <div className="container-max py-8 lg:py-10">
        <div className="mb-8 glass-panel border-orange-500/20 p-8 lg:p-10 shadow-glass-lg">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-50 mb-3 leading-tight">{kit.projectTitle}</h1>
              <p className="text-lg text-slate-400 max-w-3xl leading-relaxed">{kit.mission}</p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <button
                type="button"
                className="btn-secondary px-4 py-2.5 flex items-center gap-2"
                onClick={() => typeof window !== 'undefined' && window.print()}
              >
                <Download className="w-4 h-4" />
                Print / save as PDF
              </button>
              <Link href="/dashboard" className="btn-primary px-4 py-2.5 flex items-center gap-2">
                <Play className="w-4 h-4" />
                Go to dashboard
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10">
            {[
              { label: 'Difficulty', value: kit.difficultyRating },
              { label: 'Timeline', value: durationSummary },
              { label: 'Volunteer roles', value: rolesSummary },
              { label: 'Est. budget', value: kit.budget.estimatedTotal },
            ].map((stat) => (
              <div key={stat.label} className="text-center rounded-xl bg-white/5 border border-white/10 py-4 px-2">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">{stat.label}</p>
                <p className="font-semibold text-slate-100">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Section title="Project Overview" editingSection={editingSection} onEdit={handleEdit}>
            <div className="space-y-5">
              <div>
                <h4 className="font-semibold text-slate-200 mb-2">Problem summary</h4>
                <p className="text-slate-400 leading-relaxed">{kit.problemSummary}</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-200 mb-2">Beneficiaries</h4>
                <p className="text-slate-400 leading-relaxed">{kit.beneficiaries}</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-200 mb-2">Estimated impact</h4>
                <p className="text-slate-400 leading-relaxed">{kit.estimatedImpact}</p>
              </div>
            </div>
          </Section>

          <Section title="Project Timeline" editingSection={editingSection} onEdit={handleEdit}>
            <div className="space-y-4">
              {kit.timeline.map((phase, idx) => (
                <div
                  key={idx}
                  className="border-l-2 border-orange-500/60 pl-5 py-2 bg-orange-500/[0.04] rounded-r-xl border-y border-r border-white/10"
                >
                  <h4 className="font-semibold text-slate-100">{phase.phase}</h4>
                  <p className="text-sm text-slate-500 mb-2">Duration: {phase.duration}</p>
                  <ul className="text-sm text-slate-400 space-y-1">
                    {phase.tasks.map((task, tidx) => (
                      <li key={tidx} className="flex gap-2">
                        <span className="text-orange-400">→</span>
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Volunteer Roles" editingSection={editingSection} onEdit={handleEdit}>
            <div className="grid md:grid-cols-2 gap-6">
              {kit.volunteerRoles.map((role, idx) => (
                <div key={idx} className="card p-6">
                  <h4 className="font-semibold text-slate-100 mb-2">{role.role}</h4>
                  <p className="text-sm text-slate-500 mb-3">Time: {role.estimatedTime}</p>
                  <ul className="text-sm text-slate-400 space-y-1">
                    {role.responsibilities.map((resp, ridx) => (
                      <li key={ridx} className="flex gap-2">
                        <span className="text-orange-400">•</span>
                        {resp}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Materials & Budget" editingSection={editingSection} onEdit={handleEdit}>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-slate-200 mb-4">Materials needed</h4>
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        <th className="text-left py-3 px-4 text-slate-400 font-semibold">Item</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-semibold">Quantity</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-semibold">Est. cost</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-semibold">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kit.materials.map((mat, idx) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.03]">
                          <td className="py-3 px-4 text-slate-200">{mat.item}</td>
                          <td className="py-3 px-4 text-slate-400">{mat.quantity}</td>
                          <td className="py-3 px-4 text-slate-400">{mat.estimatedCost}</td>
                          <td className="py-3 px-4 text-slate-500 text-xs">{mat.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-200 mb-3">Budget summary</h4>
                <div className="rounded-xl border border-orange-400/25 bg-orange-500/10 backdrop-blur-sm p-5 mb-4 shadow-glow-sm">
                  <p className="text-2xl font-bold text-orange-200">{kit.budget.estimatedTotal}</p>
                  <p className="text-sm text-orange-200/80">Estimated total</p>
                </div>

                <div>
                  <h5 className="font-medium text-slate-200 mb-2">Low-cost alternatives</h5>
                  <ul className="space-y-2 text-sm text-slate-400">
                    {kit.budget.lowCostAlternatives.map((alt, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-orange-400">✓</span>
                        {alt}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Safety & Considerations" editingSection={editingSection} onEdit={handleEdit}>
            <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 backdrop-blur-sm p-5 space-y-3">
              <h4 className="font-semibold text-amber-100">Safety considerations</h4>
              <ul className="space-y-2 text-sm text-amber-100/90">
                {kit.safetyConsiderations.map((concern, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span>⚠</span>
                    {concern}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <h4 className="font-semibold text-slate-200 mb-3">Permissions needed</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                {kit.permissionsNeeded.map((perm, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-orange-400">→</span>
                    {perm}
                  </li>
                ))}
              </ul>
            </div>
          </Section>

          <Section title="Outreach Templates" editingSection={editingSection} onEdit={handleEdit}>
            <div className="space-y-6">
              {[
                { title: 'Donor email', content: kit.outreach.donorEmail },
                { title: 'Advisor email', content: kit.outreach.advisorEmail },
                { title: 'Community partner email', content: kit.outreach.partnerEmail },
                { title: 'Social media post', content: kit.outreach.socialMediaCaption },
              ].map((template) => (
                <div key={template.title} className="rounded-xl border border-white/10 p-5 bg-white/[0.03]">
                  <h4 className="font-semibold text-slate-100 mb-3">{template.title}</h4>
                  <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-400 whitespace-pre-wrap font-mono text-xs leading-relaxed">
                    {template.content}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Impact Metrics to Track" editingSection={editingSection} onEdit={handleEdit}>
            <div className="grid md:grid-cols-2 gap-4">
              {kit.impactMetrics.map((metric, idx) => (
                <div key={idx} className="card p-4">
                  <p className="font-medium text-slate-200">{metric}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Questions for Community Partner" editingSection={editingSection} onEdit={handleEdit}>
            <ul className="space-y-3">
              {kit.partnerQuestions.map((question, idx) => (
                <li key={idx} className="flex gap-3 p-4 rounded-xl bg-white/[0.04] border border-white/10">
                  <span className="text-orange-400 font-bold flex-shrink-0">{idx + 1}.</span>
                  <span className="text-slate-400">{question}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="AI Assumptions" editingSection={editingSection} onEdit={handleEdit}>
            <div className="rounded-xl border border-sky-400/25 bg-sky-500/10 backdrop-blur-sm p-5">
              <p className="text-sm text-sky-100/90 mb-3">
                The AI made these assumptions when creating this project plan. Confirm them with the community partner:
              </p>
              <ul className="space-y-2 text-sm text-sky-100/85">
                {kit.assumptions.map((assumption, idx) => (
                  <li key={idx} className="flex gap-2">
                    <input type="checkbox" className="mt-0.5 rounded border-white/20 bg-slate-900 accent-orange-500" readOnly />
                    {assumption}
                  </li>
                ))}
              </ul>
            </div>
          </Section>

          <div className="card p-10 text-center space-y-5 border-orange-500/20 shadow-glow-sm">
            <h3 className="text-2xl font-bold text-slate-50">Ready to execute this project?</h3>
            <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">
              After reviewing with your advisor and confirming details with the community partner, you can create an execution board and start assigning tasks.
            </p>
            <Link href={`/projects/new?kit=${needId ?? ''}`} className="btn-primary inline-flex px-8 py-3">
              Start project execution
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({
  title,
  children,
  editingSection,
  onEdit,
}: {
  title: string
  children: React.ReactNode
  editingSection: string | null
  onEdit: (sectionId: string) => void
}) {
  const id = sectionSlug(title)

  return (
    <div className="card p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-50">{title}</h2>
        <button
          type="button"
          onClick={() => onEdit(id)}
          className="btn-ghost p-2 rounded-lg"
          title="Edit section"
          aria-pressed={editingSection === id}
        >
          <Edit2 className="w-5 h-5 text-slate-400" />
        </button>
      </div>
      {children}
    </div>
  )
}
