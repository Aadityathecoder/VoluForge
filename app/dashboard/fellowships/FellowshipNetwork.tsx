'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, ArrowUpRight, CircleHelp, Users } from 'lucide-react'

type Member = {
  id: string
  name: string
  profile_role: string
  school_or_org: string
  location: string
  bio: string
  member_role: string
  member_status: string
}
type LinkedProject = { id: string; title: string; status: string }
export type Fellowship = {
  fellowship_id: string
  name: string
  cohort: string
  description: string
  starts_on: string | null
  ends_on: string | null
  member_role: string
  members: Member[]
  projects: LinkedProject[]
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function dateRange(start: string | null, end: string | null) {
  if (!start && !end) return 'Dates set by your cohort'
  const format = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  return `${start ? format(start) : 'Ongoing'} – ${end ? format(end) : 'Ongoing'}`
}

export function FellowshipNetwork({ fellowships, setupPending = false }: { fellowships: Fellowship[]; setupPending?: boolean }) {
  const router = useRouter()
  const [invite, setInvite] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function join() {
    setMessage('')
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invite.trim())) {
      setMessage('Enter the invitation code your fellowship coordinator shared.')
      return
    }
    setBusy(true)
    try {
      const client = createClient() as any
      if (typeof client.rpc !== 'function') throw new Error('Fellowship access is unavailable right now.')
      const { error } = await client.rpc('join_fellowship', { p_invite_code: invite.trim() })
      if (error) throw error
      setInvite('')
      setMessage('You’re in. Your fellowship roster is ready.')
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'We could not use that invitation. Check the code and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      {setupPending && <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.07] p-4 text-sm text-amber-100">Fellowship data is not available yet. Apply the new fellowship migration to enable cohort rosters and invitations.</div>}
      <section className="card p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-orange-400/10 p-2.5 text-orange-300"><Users className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-slate-100">Join your fellowship</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">Use the private invitation code from your coordinator. Only members of the same fellowship can see its roster.</p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input value={invite} onChange={(event) => setInvite(event.target.value)} placeholder="Invitation code" aria-label="Fellowship invitation code" className="input-field min-w-0 flex-1 font-mono" />
          <button type="button" onClick={() => void join()} disabled={busy || setupPending} className="btn-primary justify-center disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Joining…' : 'Join fellowship'} <ArrowRight className="ml-2 h-4 w-4" /></button>
        </div>
        {message && <p role="status" className="mt-3 text-sm text-slate-300">{message}</p>}
      </section>

      {fellowships.length ? fellowships.map((fellowship) => (
        <section key={fellowship.fellowship_id} className="card overflow-hidden">
          <div className="border-b border-white/10 bg-gradient-to-r from-orange-500/[0.11] to-transparent p-5 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">{fellowship.cohort} · {fellowship.member_role}</p>
            <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="text-xl font-bold text-slate-50 sm:text-2xl">{fellowship.name}</h2><p className="mt-1 text-sm text-slate-400">{dateRange(fellowship.starts_on, fellowship.ends_on)}</p></div>
              <span className="badge badge-success">Active cohort</span>
            </div>
            {fellowship.description && <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">{fellowship.description}</p>}
          </div>
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.25fr_0.75fr]">
            <div>
              <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold text-slate-100">People in your cohort</h3><span className="text-xs text-slate-500">{fellowship.members.length} members</span></div>
              <div className="grid gap-3 sm:grid-cols-2">
                {fellowship.members.map((member) => <article key={member.id} className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
                  <div className="flex items-center gap-3"><div aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-400/15 text-xs font-bold text-orange-200">{initials(member.name)}</div><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-100">{member.name}</p><p className="text-xs capitalize text-slate-400">{member.member_role}{member.member_status === 'alumni' ? ' · alum' : ''}</p></div></div>
                  {member.school_or_org && <p className="mt-3 truncate text-xs text-slate-400">{member.school_or_org}</p>}
                  {member.bio && <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-500">{member.bio}</p>}
                </article>)}
              </div>
              {!fellowship.members.length && <p className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-slate-500">Your cohort roster is being formed.</p>}
            </div>
            <div>
              <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold text-slate-100">Shared missions</h3><span className="text-xs text-slate-500">{fellowship.projects.length} linked</span></div>
              <div className="space-y-3">
                {fellowship.projects.length ? fellowship.projects.map((project) => <a key={project.id} href={`/dashboard/projects/${project.id}`} className="group flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-4 transition hover:border-orange-400/25 hover:bg-white/[0.045]">
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-200">{project.title}</p><p className="mt-1 text-xs capitalize text-slate-500">{project.status.replaceAll('_', ' ')}</p></div><ArrowUpRight className="h-4 w-4 shrink-0 text-slate-500 group-hover:text-orange-300" />
                </a>) : <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm leading-6 text-slate-500">Your coordinator can connect a community project to this fellowship as the squad’s shared mission.</div>}
              </div>
              <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500"><CircleHelp className="mt-0.5 h-4 w-4 shrink-0" />Contact details stay private. Coordinate through your fellowship’s approved channels.</div>
            </div>
          </div>
        </section>
      )) : (!setupPending && <div className="empty-state py-12"><div className="empty-state-title">Your fellowship will show up here</div><p className="empty-state-description">Join with an invitation code to meet your cohort, see mentors, and find the community projects your squad is working on.</p></div>)}
    </div>
  )
}
