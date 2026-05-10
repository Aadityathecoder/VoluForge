'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowRight, CheckCircle2, FileBarChart, ShieldCheck, Users } from 'lucide-react'
import type { UserRole } from '@/types/database'

type SignUpResponse = {
  error?: string
  requiresEmailConfirmation?: boolean
}

const roleOptions: { value: UserRole; label: string; description: string }[] = [
  {
    value: 'student',
    label: 'Student leader',
    description: 'Claim needs, run projects, and log impact.',
  },
  {
    value: 'partner',
    label: 'Community partner',
    description: 'Submit real needs and review delivery plans.',
  },
  {
    value: 'advisor',
    label: 'Advisor',
    description: 'Oversee feasibility, safety, and completion.',
  },
]

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<UserRole>('student')
  const [schoolOrOrg, setSchoolOrOrg] = useState('')
  const [location, setLocation] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmEmailMessage, setConfirmEmailMessage] = useState(false)

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setConfirmEmailMessage(false)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          role,
          schoolOrOrg,
          location,
          origin: typeof window !== 'undefined' ? window.location.origin : '',
        }),
      })

      const result = (await response.json()) as SignUpResponse

      if (!response.ok) {
        setError(result.error ?? 'Unable to create your account.')
        return
      }

      if (result.requiresEmailConfirmation) {
        setConfirmEmailMessage(true)
        return
      }

      window.location.assign('/dashboard')
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
              <ShieldCheck className="h-3.5 w-3.5 text-sky-500" />
              Production-ready workflow
            </div>

            <h1 className="theme-strong-text mt-6 text-4xl font-semibold tracking-[-0.04em] md:text-5xl">
              Create the workspace your team can actually run projects from.
            </h1>

            <p className="theme-soft-text mt-5 max-w-xl text-base leading-7">
              Accounts in VoluForge are structured for real collaboration: who submitted the need, who is running the
              project, and who is responsible for oversight.
            </p>

            <div className="mt-10 space-y-4">
              {[
                {
                  icon: Users,
                  title: 'Role-aware accounts',
                  body: 'Students, partners, and advisors each get the right entry point into the same project flow.',
                },
                {
                  icon: FileBarChart,
                  title: 'Persistent project records',
                  body: 'Signup stores your auth account and profile metadata so you can return to the same workspace later.',
                },
                {
                  icon: CheckCircle2,
                  title: 'Partner-ready execution',
                  body: 'Plans, budgets, and impact reporting are structured from the first day of account creation.',
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
              <p className="theme-soft-text text-sm font-semibold uppercase tracking-[0.22em]">Create account</p>
              <h2 className="theme-strong-text mt-3 text-3xl font-semibold tracking-tight">Join VoluForge</h2>
              <p className="theme-soft-text mt-3">
                Set up your account once, then return anytime to manage needs, plans, and project outcomes.
              </p>
            </div>

            {confirmEmailMessage ? (
              <div className="rounded-[1.5rem] border border-emerald-400/25 bg-emerald-500/10 p-6 backdrop-blur-sm">
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
                  <div className="space-y-2 text-sm text-emerald-100/95">
                    <p className="font-medium text-emerald-50">Check your email</p>
                    <p>
                      We sent a confirmation link to <strong className="text-emerald-50">{email}</strong>. Open it to
                      activate your account and finish the first sign-in.
                    </p>
                    <Link href="/auth/login" className="inline-flex items-center gap-2 pt-2 font-medium text-sky-600 hover:text-sky-500 dark:text-sky-300 dark:hover:text-sky-200">
                      Go to sign in
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => void handleSignUp(e)} className="space-y-5">
                {error && (
                  <div className="rounded-2xl border border-red-400/25 bg-red-500/10 p-4 backdrop-blur-sm">
                    <div className="flex gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                      <p className="text-sm font-medium text-red-200">{error}</p>
                    </div>
                  </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="label-text">Full name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input-field"
                      placeholder="Your full name"
                      autoComplete="name"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label-text">Email</label>
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

                  <div className="sm:col-span-2">
                    <label className="label-text">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field"
                      placeholder="Create a password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                    />
                    <p className="theme-soft-text mt-1.5 text-xs">Use at least 8 characters.</p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label-text">Primary role</label>
                    <div className="grid gap-3">
                      {roleOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setRole(option.value)}
                          className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                            role === option.value
                              ? 'border-sky-500/40 bg-sky-500/10 shadow-glow-sm'
                              : 'border-transparent bg-transparent hover:border-slate-300/50 hover:bg-white/30 dark:hover:border-white/20 dark:hover:bg-white/[0.05]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className={`font-medium ${role === option.value ? 'text-sky-700 dark:text-sky-300' : 'theme-strong-text'}`}>
                                {option.label}
                              </p>
                              <p className="theme-soft-text mt-1 text-sm">{option.description}</p>
                            </div>
                            <div
                              className={`h-4 w-4 rounded-full border ${
                                role === option.value
                                  ? 'border-sky-500 bg-sky-500'
                                  : 'border-slate-300 bg-transparent dark:border-white/20'
                              }`}
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="label-text">{role === 'partner' ? 'Organization' : 'School / organization'}</label>
                    <input
                      type="text"
                      value={schoolOrOrg}
                      onChange={(e) => setSchoolOrOrg(e.target.value)}
                      className="input-field"
                      placeholder={role === 'partner' ? 'Partner organization' : 'School or team name'}
                      autoComplete="organization"
                      required
                    />
                  </div>

                  <div>
                    <label className="label-text">City / region</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="input-field"
                      placeholder="Plantation, FL"
                      autoComplete="address-level2"
                    />
                  </div>
                </div>

                <button type="submit" disabled={isLoading} className="w-full btn-primary py-3.5 disabled:opacity-50">
                  {isLoading ? 'Creating account...' : 'Create account'}
                </button>
              </form>
            )}

            {!confirmEmailMessage && (
              <p className="theme-soft-text mt-8 text-center text-sm">
                Already have an account?{' '}
                <Link href="/auth/login" className="font-medium text-sky-600 hover:text-sky-500 dark:text-sky-300 dark:hover:text-sky-200">
                  Sign in
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
