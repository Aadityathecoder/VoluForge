'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const supabase = createClient()
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/dashboard`,
      })
      if (resetError) {
        setError(resetError.message)
        return
      }
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="glass-panel border-white/12 p-8 sm:p-10 shadow-glass-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-50 mb-2">Reset password</h1>
            <p className="text-slate-400">We&apos;ll email you a secure link to choose a new password.</p>
          </div>

          {sent ? (
            <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 backdrop-blur-sm p-5 flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-emerald-100/95 space-y-2">
                <p className="font-medium text-emerald-50">Check your inbox</p>
                <p>If an account exists for {email}, you will receive a reset link shortly.</p>
                <Link href="/auth/login" className="inline-block mt-2 font-medium text-orange-400 hover:text-orange-300">
                  Back to sign in →
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
              {error && (
                <div className="rounded-xl border border-red-400/25 bg-red-500/10 backdrop-blur-sm p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-200">{error}</p>
                </div>
              )}

              <div>
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

              <button type="submit" disabled={isLoading} className="w-full btn-primary py-3 disabled:opacity-50">
                {isLoading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
