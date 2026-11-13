import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getViewer, homeFor } from '@/lib/viewer'
import { Logo } from '@/components/Logo'
import { Notice } from '@/components/Notice'
import { SubmitButton } from '@/components/SubmitButton'
import { chooseAccountType } from './actions'

export const metadata: Metadata = { title: 'Finish setting up' }
export default async function Onboarding({ searchParams }: { searchParams: Promise<{ role?: string; error?: string }> }) {
  const viewer = await getViewer()
  if (!viewer) redirect('/login')
  if (viewer.accountType) redirect(homeFor(viewer))
  const { role, error } = await searchParams
  return (
    <div className="px-4 py-6 sm:px-10">
      <Logo />
      <main className="mx-auto max-w-xl py-16">
        <h1 className="h-page">One question before you start</h1>
        <p className="mt-3 text-ink/70">How will you use VoluForge? You can't switch this later, so pick the one that fits.</p>
        <form action={chooseAccountType} className="mt-8 space-y-5">
          {error && <Notice tone="error">{error}</Notice>}
          <div className="grid gap-3 sm:grid-cols-2">
            {([['student', 'I am a student', 'Join fellowships, apply for volunteer work, and track approved hours.'], ['admin', 'I run fellowships', 'Create fellowships for students and choose who joins each cohort.']] as const).map(([value, title, body]) => (
              <label key={value} className="panel flex cursor-pointer gap-3 p-4 has-[:checked]:border-ink has-[:checked]:ring-1 has-[:checked]:ring-ink">
                <input type="radio" name="type" value={value} defaultChecked={(role === 'admin' ? 'admin' : 'student') === value} className="mt-1 text-forest focus:ring-forest" />
                <span><span className="block font-semibold">{title}</span><span className="mt-1 block text-sm text-muted">{body}</span></span>
              </label>
            ))}
          </div>
          <div>
            <label htmlFor="organization" className="label">School or organization <span className="font-normal text-muted">(administrators only)</span></label>
            <input id="organization" name="organization" maxLength={200} className="field" />
          </div>
          <SubmitButton pending="Saving…">Continue</SubmitButton>
        </form>
      </main>
    </div>
  )
}
