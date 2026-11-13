import { createClient } from './supabase/server'

export type Fellowship = {
  id: string; title: string; summary: string; description: string; focus: string; location: string; remote: boolean
  starts_on: string; ends_on: string; apply_by: string | null; capacity: number; weekly_hours: number
  status: 'draft' | 'open' | 'closed'; host: string; host_verified: boolean; seats_left: number
  my_status: 'pending' | 'accepted' | 'declined' | 'withdrawn' | null
}
export type AdminFellowship = Omit<Fellowship, 'host' | 'host_verified' | 'seats_left' | 'my_status'> & {
  join_code: string; pending: number; accepted: number; created_at: string
}
export type RosterRow = {
  student_id: string; full_name: string; school: string; skills: string[]; causes: string[]
  message: string; status: 'pending' | 'accepted' | 'declined' | 'withdrawn'; admin_note: string; created_at: string
}
export type Opportunity = {
  id: string; title: string; description: string; category: string; location: string; remote: boolean
  starts_at: string; ends_at: string; capacity: number; min_age: number; skills: string[]; image_url: string | null
  status: string; organization: string; spots_left: number
}

/** The fellowship RPCs ship in migration 202611130001. Surface a clear message if it is not applied yet. */
export const missingMigration = (e: { code?: string } | null) => !!e && ['PGRST202', '42883', 'PGRST205'].includes(e.code ?? '')

export async function fellowshipDirectory(code?: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('vf_fellowship_directory', { p_code: code?.trim() || null })
  return { rows: (data ?? []) as Fellowship[], error }
}

export async function opportunities() {
  const supabase = await createClient()
  const [rows, orgs, spots] = await Promise.all([
    supabase.from('vf_opportunities').select('*').eq('status', 'published').order('starts_at'),
    supabase.from('vf_organizations').select('id,name'),
    supabase.rpc('vf_available_spots'),
  ])
  const orgName = new Map((orgs.data ?? []).map((o: { id: string; name: string }) => [o.id, o.name]))
  const left = new Map((spots.data ?? []).map((s: { opportunity_id: string; spots_left: number }) => [s.opportunity_id, s.spots_left]))
  const list: Opportunity[] = (rows.data ?? []).map((r: any) => ({
    ...r, organization: orgName.get(r.org_id) ?? 'Community organization', spots_left: left.get(r.id) ?? r.capacity,
  }))
  return { rows: list.filter(o => new Date(o.ends_at) > new Date()), error: rows.error }
}

export async function myApplications(userId: string) {
  const supabase = await createClient()
  const [apps, entries] = await Promise.all([
    supabase.from('vf_applications').select('*').eq('student_id', userId).order('created_at', { ascending: false }),
    supabase.from('vf_service_entries').select('minutes,status,service_date').eq('student_id', userId),
  ])
  const approvedMinutes = (entries.data ?? []).filter((e: any) => e.status === 'approved').reduce((n: number, e: any) => n + e.minutes, 0)
  const pendingMinutes = (entries.data ?? []).filter((e: any) => e.status === 'submitted').reduce((n: number, e: any) => n + e.minutes, 0)
  return { applications: (apps.data ?? []) as any[], approvedMinutes, pendingMinutes }
}
