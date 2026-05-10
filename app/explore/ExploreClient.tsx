'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { MapPin, Users, Calendar, Filter } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { CommunityNeed } from '@/types/database'

function formatImpact(need: CommunityNeed): string {
  if (need.estimated_people_impacted != null) {
    return `~${need.estimated_people_impacted} people`
  }
  return 'See description'
}

export function ExploreClient({ initialNeeds }: { initialNeeds: CommunityNeed[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showFilters, setShowFilters] = useState(false)

  const categories = useMemo(() => {
    const set = new Set(initialNeeds.map((n) => n.category).filter(Boolean))
    return ['All', ...Array.from(set).sort()]
  }, [initialNeeds])

  const filteredNeeds = initialNeeds.filter((need) => {
    const hay =
      `${need.organization_name} ${need.description} ${need.category} ${need.location}`.toLowerCase()
    const matchesSearch = hay.includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || need.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen pb-16">
      <div className="container-max py-10">
        <div className="max-w-3xl mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-50 mb-3">Community needs</h1>
          <p className="text-slate-400 text-lg">
            Browse needs posted by community partners and start a student-led project kit.
          </p>
        </div>

        <div className="mb-10 space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search organizations, descriptions, categories..."
              className="input-field flex-1"
            />
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary px-4 shrink-0"
              title="Toggle filters"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {showFilters && (
            <p className="text-sm text-slate-500 glass-panel px-4 py-3">
              More filters (location, deadline ranges) can be added from your dashboard filters later.
            </p>
          )}

          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-b from-orange-400 to-orange-600 text-white shadow-glow-sm border border-orange-400/30'
                    : 'border border-white/12 bg-white/5 text-slate-300 backdrop-blur-sm hover:border-orange-500/30 hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6">
          {filteredNeeds.length > 0 ? (
            filteredNeeds.map((need) => (
              <div key={need.id} className="card-hover p-6 lg:p-8">
                {need.image_url && (
                  <div className="mb-5 overflow-hidden rounded-2xl border border-white/10">
                    <img
                      src={need.image_url}
                      alt={need.detected_item_label ?? `${need.organization_name} need item`}
                      className="h-56 w-full object-cover"
                    />
                  </div>
                )}

                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100 mb-1">{need.organization_name}</h3>
                    <p className="text-sm text-slate-500">{need.category}</p>
                  </div>
                  <div className={`badge shrink-0 ${need.status === 'open' ? 'badge-success' : 'badge-neutral'}`}>
                    {need.status === 'open' ? 'Open' : need.status === 'claimed' ? 'Claimed' : need.status}
                  </div>
                </div>

                <p className="text-slate-400 mb-5 leading-relaxed">{need.description}</p>

                {need.detected_item_label && (
                  <div className="mb-5">
                    <span className="badge badge-primary text-xs">Detected item: {need.detected_item_label}</span>
                  </div>
                )}

                <div className="grid sm:grid-cols-3 gap-4 mb-5 py-4 border-y border-white/10">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <MapPin className="w-4 h-4 text-orange-500/70 shrink-0" />
                    {need.location}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Users className="w-4 h-4 text-orange-500/70 shrink-0" />
                    {formatImpact(need)}
                  </div>
                  {need.deadline && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Calendar className="w-4 h-4 text-orange-500/70 shrink-0" />
                      {formatDate(need.deadline)}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <span className="badge badge-primary text-xs">{need.category}</span>
                  {need.status === 'open' && (
                    <Link href={`/project-kits/new?need=${need.id}`} className="btn-primary px-5 py-2 text-sm">
                      Create project kit
                    </Link>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="card p-12 empty-state">
              <p className="empty-state-title">
                {initialNeeds.length === 0 ? 'No community needs yet' : 'No matching needs'}
              </p>
              <p className="empty-state-description">
                {initialNeeds.length === 0
                  ? 'When partners submit needs, they will appear here. You can submit one if your organization has a need.'
                  : 'Try adjusting your search or category filters.'}
              </p>
              {initialNeeds.length === 0 && (
                <Link href="/submit-need" className="btn-primary mt-4 inline-flex">
                  Submit a need
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="mt-12 glass-panel border-orange-500/20 p-8 lg:p-10 text-center shadow-glow-sm">
          <h3 className="text-lg font-semibold text-slate-100 mb-2">
            Don&apos;t see what you&apos;re looking for?
          </h3>
          <p className="text-slate-400 mb-6 max-w-lg mx-auto">
            Community organizations can submit needs for student teams to discover.
          </p>
          <Link href="/submit-need" className="btn-primary inline-flex">
            Submit a need
          </Link>
        </div>
      </div>
    </div>
  )
}
