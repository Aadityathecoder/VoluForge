'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function applyToOpportunity(form: FormData) {
  const id = String(form.get('id'))
  const supabase = await createClient()
  const { error } = await supabase.rpc('vf_apply_to_opportunity', { p_opportunity_id: id, p_message: String(form.get('message') ?? ''), p_availability: String(form.get('availability') ?? '') })
  if (error) redirect(`/opportunities/${id}?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/activity')
  redirect(`/opportunities/${id}?done=applied`)
}

export async function withdrawApplication(form: FormData) {
  const id = String(form.get('id'))
  const supabase = await createClient()
  const { error } = await supabase.rpc('vf_withdraw_application', { p_application_id: String(form.get('application')) })
  if (error) redirect(`/opportunities/${id}?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/activity')
  redirect(`/opportunities/${id}?done=withdrawn`)
}
