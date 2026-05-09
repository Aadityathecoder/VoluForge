import { Suspense } from 'react'
import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center text-slate-400">Loading…</div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
