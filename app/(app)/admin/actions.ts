'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim()
export async function saveFellowship(form: FormData) {
  const id = str(form, 'id') || null
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('vf_admin_save_fellowship', {
    p_id: id, p_title: str(form, 'title'), p_summary: str(form, 'summary'), p_description: str(form, 'description'),
    p_focus: str(form, 'focus'), p_location: str(form, 'location'), p_remote: form.get('remote') === 'on',
    p_starts_on: str(form, 'starts_on'), p_ends_on: str(form, 'ends_on'), p_apply_by: str(form, 'apply_by') || null,
    p_capacity: Number(form.get('capacity')), p_weekly_hours: Number(form.get('weekly_hours')),
    p_status: form.get('intent') === 'open' ? 'open' : str(form, 'status') || 'draft',
  })
  const back = id ? `/admin/fellowships/${id}` : '/admin/fellowships/new'
  if (error) redirect(`${back}?error=${encodeURIComponent(friendly(error.message))}`)
  revalidatePath('/admin')
  redirect(`/admin/fellowships/${data}?saved=1`)
}

export async function setStatus(form: FormData) {
  const id = str(form, 'id')
  const supabase = await createClient()
  const { data: rows } = await supabase.rpc('vf_admin_fellowships')
  const f = (rows ?? []).find((r: any) => r.id === id)
  if (!f) redirect('/admin')
  const { error } = await supabase.rpc('vf_admin_save_fellowship', {
    p_id: id, p_title: f.title, p_summary: f.summary, p_description: f.description, p_focus: f.focus, p_location: f.location,
    p_remote: f.remote, p_starts_on: f.starts_on, p_ends_on: f.ends_on, p_apply_by: f.apply_by, p_capacity: f.capacity,
    p_weekly_hours: f.weekly_hours, p_status: str(form, 'status'),
  })
  if (error) redirect(`/admin/fellowships/${id}?error=${encodeURIComponent(friendly(error.message))}`)
  revalidatePath('/admin')
  redirect(`/admin/fellowships/${id}?saved=status`)
}

export async function decide(form: FormData) {
  const id = str(form, 'id')
  const supabase = await createClient()
  const { error } = await supabase.rpc('vf_admin_decide_enrollment', { p_id: id, p_student: str(form, 'student'), p_decision: str(form, 'decision'), p_note: str(form, 'note') })
  if (error) redirect(`/admin/fellowships/${id}?error=${encodeURIComponent(error.message)}#roster`)
  revalidatePath('/admin')
  redirect(`/admin/fellowships/${id}#roster`)
}

export async function newCode(form: FormData) {
  const id = str(form, 'id')
  const supabase = await createClient()
  const { error } = await supabase.rpc('vf_admin_new_join_code', { p_id: id })
  if (error) redirect(`/admin/fellowships/${id}?error=${encodeURIComponent(error.message)}`)
  redirect(`/admin/fellowships/${id}?saved=code`)
}

export async function deleteFellowship(form: FormData) {
  const id = str(form, 'id')
  const supabase = await createClient()
  const { error } = await supabase.rpc('vf_admin_delete_fellowship', { p_id: id })
  if (error) redirect(`/admin/fellowships/${id}?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/admin')
  redirect('/admin?deleted=1')
}

function friendly(message: string) {
  if (message.includes('vf_fellowships_check') || message.includes('ends_on')) return 'The end date must be on or after the start date, and the apply-by date before the end.'
  if (message.includes('title')) return 'Give the fellowship a title of at least 3 characters.'
  if (message.includes('capacity') || message.includes('weekly_hours')) return 'Check the seats (1 to 5000) and weekly hours (1 to 60).'
  return message
}
