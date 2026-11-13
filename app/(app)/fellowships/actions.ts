'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function applyToFellowship(form: FormData) {
  const id = String(form.get('id'))
  const code = String(form.get('code') ?? '') || null
  const supabase = await createClient()
  const { error } = await supabase.rpc('vf_apply_to_fellowship', { p_fellowship_id: id, p_message: String(form.get('message') ?? ''), p_code: code })
  const q = code ? `code=${encodeURIComponent(code)}&` : ''
  if (error) redirect(`/fellowships/${id}?${q}error=${encodeURIComponent(error.message)}`)
  revalidatePath('/home'); revalidatePath('/fellowships')
  redirect(`/fellowships/${id}?${q}done=applied`)
}

export async function withdrawFromFellowship(form: FormData) {
  const id = String(form.get('id'))
  const supabase = await createClient()
  const { error } = await supabase.rpc('vf_withdraw_from_fellowship', { p_fellowship_id: id })
  if (error) redirect(`/fellowships/${id}?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/home'); revalidatePath('/fellowships')
  redirect(`/fellowships/${id}?done=withdrawn`)
}
