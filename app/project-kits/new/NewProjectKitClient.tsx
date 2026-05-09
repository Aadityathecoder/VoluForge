'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Loader, AlertCircle, CheckCircle2 } from 'lucide-react'
import { ProjectKitDisplay } from '@/components/projects/ProjectKitDisplay'
import type { ProjectKitAIResponse } from '@/types/projectKit'
import type { CommunityNeed } from '@/types/database'

export function NewProjectKitClient({
  initialNeeds,
  initialNeedId,
}: {
  initialNeeds: CommunityNeed[]
  initialNeedId: string | null
}) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedKit, setGeneratedKit] = useState<ProjectKitAIResponse | null>(null)
  const [error, setError] = useState('')
  const [selectedNeedId, setSelectedNeedId] = useState<string | null>(null)

  const needsById = useMemo(() => Object.fromEntries(initialNeeds.map((n) => [n.id, n])), [initialNeeds])

  useEffect(() => {
    if (initialNeedId && needsById[initialNeedId]) {
      setSelectedNeedId(initialNeedId)
    }
  }, [initialNeedId, needsById])

  const selectedNeed = selectedNeedId ? needsById[selectedNeedId] : null

  async function generateKit() {
    if (!selectedNeedId || !selectedNeed) {
      setError('Please select a community need')
      return
    }

    setError('')
    setIsGenerating(true)

    try {
      const res = await fetch('/api/project-kits/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ needId: selectedNeedId }),
      })
      const data = (await res.json()) as { kit?: ProjectKitAIResponse; error?: string }

      if (!res.ok) {
        throw new Error(data.error ?? 'Generation failed')
      }

      if (!data.kit) {
        throw new Error('No kit returned')
      }

      setGeneratedKit(data.kit)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate project kit')
    } finally {
      setIsGenerating(false)
    }
  }

  if (generatedKit) {
    return <ProjectKitDisplay kit={generatedKit} needId={selectedNeedId ?? undefined} />
  }

  return (
    <div className="min-h-screen pb-16">
      <div className="container-max py-8 lg:py-10">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-50 mb-8">Generate project kit</h1>

        {initialNeeds.length === 0 ? (
          <div className="card p-10 max-w-xl">
            <p className="text-slate-300 mb-4">
              There are no open community needs available yet. Partners can submit needs so student teams can build
              kits against real requests.
            </p>
            <button type="button" className="btn-secondary" onClick={() => router.push('/explore')}>
              Back to explore
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="card p-6 lg:p-8 sticky top-24">
                <h2 className="text-lg font-semibold text-slate-100 mb-5">Selected need</h2>

                {selectedNeed ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">Organization</p>
                      <p className="font-semibold text-slate-100">{selectedNeed.organization_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">Need</p>
                      <p className="text-sm text-slate-400 leading-relaxed">{selectedNeed.description}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">Category</p>
                      <span className="badge badge-primary text-xs">{selectedNeed.category}</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">Location</p>
                      <p className="text-sm text-slate-400">{selectedNeed.location}</p>
                    </div>
                    <button type="button" onClick={() => setSelectedNeedId(null)} className="w-full btn-ghost text-sm">
                      Change need
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {initialNeeds.map((need) => (
                      <button
                        key={need.id}
                        type="button"
                        onClick={() => setSelectedNeedId(need.id)}
                        className="w-full text-left p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:border-orange-500/35 hover:bg-orange-500/5 transition-all"
                      >
                        <p className="font-medium text-slate-100 text-sm">{need.organization_name}</p>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{need.description}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="card p-8 lg:p-10 space-y-6 border-orange-500/15">
                <div>
                  <h2 className="text-2xl font-bold text-slate-50 mb-2">AI project kit generator</h2>
                  <p className="text-slate-400 leading-relaxed">
                    VoluForge analyzes the selected community need and generates a structured project plan. Requires an
                    Anthropic API key configured on the server.
                  </p>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-400/25 bg-red-500/10 backdrop-blur-sm p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-200">{error}</p>
                  </div>
                )}

                <div className="rounded-xl border border-sky-400/25 bg-sky-500/10 backdrop-blur-sm p-4">
                  <p className="text-sm text-sky-100/90">
                    <strong className="text-sky-50">Note:</strong> AI-generated plans are drafts. Review with an advisor
                    and your community partner before execution.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-100 mb-3">What you&apos;ll get</h3>
                  <ul className="space-y-2.5 text-sm text-slate-400">
                    {[
                      'Project title, mission, and timeline',
                      'Phases and tasks',
                      'Volunteer roles and estimates',
                      'Materials and budget ideas',
                      'Outreach drafts',
                      'Safety considerations and metrics',
                    ].map((item) => (
                      <li key={item} className="flex gap-2">
                        <CheckCircle2 className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => void generateKit()}
                  disabled={isGenerating || !selectedNeed}
                  className="w-full btn-primary py-3.5 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isGenerating && <Loader className="w-5 h-5 animate-spin" />}
                  {isGenerating ? 'Generating project kit...' : 'Generate project kit'}
                </button>

                <p className="text-xs text-slate-500 text-center">
                  Generation usually takes 15–45 seconds depending on model load.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
