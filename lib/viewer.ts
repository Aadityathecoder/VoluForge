import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from './supabase/server'

export type Viewer = {
  id: string
  email: string
  fullName: string
  school: string
  accountType: 'student' | 'admin' | null
  organization: string
  verified: boolean
}

export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.rpc('vf_me')
  const me = Array.isArray(data) ? data[0] : null
  return {
    id: user.id,
    email: user.email ?? '',
    fullName: me?.full_name || (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || '',
    school: me?.school ?? '',
    accountType: me?.account_type ?? null,
    organization: me?.admin_organization ?? '',
    verified: Boolean(me?.admin_verified),
  }
})

/** Signed-in page guard. Sends people without an account type to onboarding. */
export async function requireViewer(role?: 'student' | 'admin') {
  const viewer = await getViewer()
  if (!viewer) redirect('/login')
  if (!viewer.accountType) redirect('/onboarding')
  if (role && viewer.accountType !== role) redirect(viewer.accountType === 'admin' ? '/admin' : '/home')
  return viewer
}

export const homeFor = (viewer: Pick<Viewer, 'accountType'>) =>
  viewer.accountType === 'admin' ? '/admin' : viewer.accountType === 'student' ? '/home' : '/onboarding'
