import type { Metadata } from 'next'
import { SignupForm } from './SignupForm'
export const metadata: Metadata = { title: 'Create account' }
export default async function Page({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role } = await searchParams
  return <SignupForm initialRole={role === 'admin' ? 'admin' : 'student'} />
}
