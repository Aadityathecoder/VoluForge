'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function chooseAccountType(form: FormData) {
  const type = form.get('type') === 'admin' ? 'admin' : 'student'
  const supabase = await createClient()
  const { error } = await supabase.rpc('vf_choose_account_type', { p_type: type, p_organization: String(form.get('organization') ?? '') })
  if (error) redirect(`/onboarding?role=${type}&error=${encodeURIComponent(error.message)}`)
  redirect(type === 'admin' ? '/admin' : '/home')
}
