'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Opportunity } from './types'

const modeLabels: Record<Opportunity['participation_mode'], string> = {
  remote: 'Remote',
  in_person: 'In person',
  hybrid: 'Hybrid',
}

export function OpportunityFilters({ opportunities }: { opportunities: Opportunity[] }) {
  const [keyword, setKeyword] = useState('')
  const [cause, setCause] = useState('')
  const [skill, setSkill] = useState('')
  const [mode, setMode] = useState('')
  const causes = [...new Set(opportunities.map((item) => item.cause))].sort()
  const skills = [...new Set(opportunities.flatMap((item) => item.skills))].sort()
  const filtered = useMemo(() => opportunities.filter((item) => {
    const searchText = [item.title, item.description, item.cause,
      item.volunteer_organizations.name, item.location ?? '', ...item.skills]
      .join(' ').toLocaleLowerCase()
    return searchText.includes(keyword.trim().toLocaleLowerCase()) &&
      (!cause || item.cause === cause) &&
      (!skill || item.skills.includes(skill)) &&
      (!mode || item.participation_mode === mode)
  }), [opportunities, keyword, cause, skill, mode])

  const hasFilters = Boolean(keyword || cause || skill || mode)
  const clear = () => { setKeyword(''); setCause(''); setSkill(''); setMode('') }

  return <>
    <div className="card mb-8 p-5 md:p-6">
      <div className="grid gap-4 md:grid-cols-4">
        <label className="text-sm theme-soft-text">Search
          <input aria-label="Search opportunities" className="input-field mt-2" value={keyword}
            onChange={(event) => setKeyword(event.target.value)} placeholder="Title, nonprofit, location..." />
        </label>
        <label className="text-sm theme-soft-text">Cause
          <select className="input-field mt-2" value={cause} onChange={(event) => setCause(event.target.value)}>
            <option value="">All causes</option>
            {causes.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-sm theme-soft-text">Skill
          <select className="input-field mt-2" value={skill} onChange={(event) => setSkill(event.target.value)}>
            <option value="">All skills</option>
            {skills.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-sm theme-soft-text">Format
          <select className="input-field mt-2" value={mode} onChange={(event) => setMode(event.target.value)}>
            <option value="">Any format</option>
            {Object.entries(modeLabels).map(([value, label]) =>
              <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-4 flex items-center justify-between gap-4 text-sm theme-soft-text">
        <span aria-live="polite">{filtered.length} {filtered.length === 1 ? 'opportunity' : 'opportunities'}</span>
        {hasFilters && <button type="button" onClick={clear} className="font-semibold text-sky-500 hover:underline">Clear filters</button>}
      </div>
    </div>

    {filtered.length === 0 ? <div className="card p-10 text-center">
      <h2 className="theme-strong-text text-xl font-semibold">No matching opportunities</h2>
      <p className="theme-soft-text mt-2">Try a broader search or clear the filters.</p>
      {hasFilters && <button type="button" onClick={clear} className="btn-secondary mt-5">Clear filters</button>}
    </div> : <div className="grid gap-5 md:grid-cols-2">
      {filtered.map((item) => <article key={item.id} className="card p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-500">
          <span>{item.cause}</span><span>·</span><span>{modeLabels[item.participation_mode]}</span>
          {item.volunteer_organizations.is_demo && <span className="badge badge-neutral">Demo listing</span>}
        </div>
        <h2 className="theme-strong-text mt-3 text-xl font-semibold">{item.title}</h2>
        <p className="theme-soft-text mt-1 text-sm">{item.volunteer_organizations.name}</p>
        <p className="theme-soft-text mt-4 line-clamp-3">{item.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {item.skills.map((value) => <span key={value} className="badge badge-primary">{value}</span>)}
        </div>
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
          <span className="theme-soft-text text-sm">{item.time_commitment}</span>
          <Link href={`/opportunities/${item.id}`} className="btn-secondary text-sm">View details</Link>
        </div>
      </article>)}
    </div>}
  </>
}
