import type { Metadata } from 'next'
import { LoginForm } from './LoginForm'
export const metadata: Metadata = { title: 'Sign in' }
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams
  return <LoginForm next={next?.startsWith('/') ? next : '/home'} error={error} />
}
