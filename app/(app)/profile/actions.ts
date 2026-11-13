'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const list = (v: FormDataEntryValue | null) => String(v ?? '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 20)
export async function saveProfile(form: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const goal = Math.min(10000, Math.max(1, Number(form.get('goal_hours')) || 50))
  const { error } = await supabase.from('vf_profiles').update({
    full_name: String(form.get('full_name') ?? '').trim().slice(0, 120),
    school: String(form.get('school') ?? '').trim().slice(0, 200),
    bio: String(form.get('bio') ?? '').trim().slice(0, 1000),
    skills: list(form.get('skills')), causes: list(form.get('causes')), goal_hours: goal,
  }).eq('id', user.id)
  if (error) redirect(`/profile?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/', 'layout')
  redirect('/profile?saved=1')
}
