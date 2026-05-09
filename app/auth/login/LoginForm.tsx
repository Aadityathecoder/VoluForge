'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, ArrowRight, ClipboardList, ShieldCheck, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextRaw = searchParams.get('next')
  const next = nextRaw && nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (searchParams.get('error') === 'auth') {
      setError('Something went wrong signing you in. Try again or reset your password.')
    }
  }, [searchParams])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error: signError } = await supabase.auth.signInWithPassword({ email, password })
      if (signError) {
        setError(signError.message)
        return
      }
      router.push(next)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  async function continueAsGuest() {
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/guest', { method: 'POST' })
      if (!response.ok) {
        setError('Unable to enter guest mode right now.')
        return
      }
      router.push(next)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container-max py-8 md:py-12">
      <div className="auth-shell grid overflow-hidden lg:grid-cols-[0.92fr_1.08fr]">
        <div className="auth-side-panel border-b p-8 lg:border-b-0 lg:border-r lg:p-12">
          <div className="relative z-10">
            <div className="badge inline-flex gap-2 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em]">
              <Sparkles className="h-3.5 w-3.5 text-sky-500" />
              Return to your workspace
            </div>

            <h1 className="theme-strong-text mt-6 text-4xl font-semibold tracking-[-0.04em] md:text-5xl">
              Pick up the project exactly where your team left it.
            </h1>

            <p className="theme-soft-text mt-5 max-w-xl text-base leading-7">
              Log back into VoluForge to review open needs, update execution tasks, and close the loop with impact
              reporting.
            </p>

            <div className="mt-10 space-y-4">
              {[
                {
                  icon: ClipboardList,
                  title: 'Project continuity',
                  body: 'Task lists, role assignments, and impact summaries stay tied to your account profile.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Role-based access',
                  body: 'Students, partners, and advisors each land in the right workspace after sign-in.',
                },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="card rounded-2xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-500/10">
                      <Icon className="h-5 w-5 text-sky-500" />
                    </div>
                    <div>
                      <p className="theme-strong-text font-medium">{title}</p>
                      <p className="theme-soft-text mt-2 text-sm leading-6">{body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative p-8 lg:p-12">
          <div className="relative z-10 mx-auto max-w-xl">
            <div className="mb-8">
              <p className="theme-soft-text text-sm font-semibold uppercase tracking-[0.22em]">Sign in</p>
              <h2 className="theme-strong-text mt-3 text-3xl font-semibold tracking-tight">Welcome back</h2>
              <p className="theme-soft-text mt-3">
                Access your VoluForge account to manage needs, plans, and student-led outcomes.
              </p>
            </div>

            <form onSubmit={(e) => void handleLogin(e)} className="space-y-5">
              {error && (
                <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-4 backdrop-blur-sm">
                  <div className="flex gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                    <p className="text-sm font-medium text-red-200">{error}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="label-text">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="label-text mb-0">Password</label>
                  <Link href="/auth/forgot-password" className="text-xs text-sky-600 hover:text-sky-500 dark:text-sky-300 dark:hover:text-sky-200">
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>

              <button type="submit" disabled={isLoading} className="w-full btn-primary py-3.5 disabled:opacity-50">
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>

              <button type="button" onClick={() => void continueAsGuest()} className="w-full btn-secondary py-3.5">
                Continue as guest
              </button>
            </form>

            <p className="theme-soft-text mt-8 text-center text-sm">
              Need a new account?{' '}
              <Link href="/auth/signup" className="inline-flex items-center gap-1 font-medium text-sky-600 hover:text-sky-500 dark:text-sky-300 dark:hover:text-sky-200">
                Create one
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
