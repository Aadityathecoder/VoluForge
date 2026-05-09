import Link from 'next/link'
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="hero-accent left-[6%] top-28 h-24 w-72 rotate-[-12deg]" />
      <div className="hero-accent right-[12%] top-36 h-20 w-56 rotate-[20deg]" />
      <div className="hero-accent bottom-14 right-[8%] h-28 w-80 rotate-[-14deg]" />

      <section className="container-max relative pt-16 pb-24 md:pt-20">
        <div className="mx-auto max-w-5xl text-center">
          <div className="hero-panel inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium theme-soft-text shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Built for student teams, partners, and advisors
          </div>

          <h1 className="mx-auto mt-8 max-w-4xl text-5xl font-semibold tracking-[-0.05em] md:text-6xl lg:text-7xl">
            Organize community service with
            <span className="block bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
              clear, modern project workflows
            </span>
          </h1>

          <p className="theme-soft-text mx-auto mt-6 max-w-3xl text-lg md:text-xl">
            VoluForge helps you collect needs, turn them into projects, and move teams forward without drowning them in
            process.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/auth/signup" className="btn-primary px-8 py-3.5 text-base">
              Get started
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/auth/login" className="btn-secondary px-8 py-3.5 text-base">
              Open dashboard
            </Link>
          </div>

          <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
            {['Student-led planning', 'Partner-friendly intake', 'Advisor oversight'].map((item) => (
              <span key={item} className="badge px-4 py-2 text-sm">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <div className="glass-panel overflow-hidden rounded-[2rem] p-4 md:p-6">
            <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="hero-panel rounded-[1.5rem] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="theme-soft-text text-xs uppercase tracking-[0.18em]">Need overview</p>
                    <h2 className="mt-2 text-2xl font-semibold">Weekend literacy kit drive</h2>
                  </div>
                  <span className="badge">Planning</span>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    ['Budget', '$950'],
                    ['Volunteers', '14'],
                    ['Deadline', 'May 28'],
                  ].map(([label, value]) => (
                    <div key={label} className="card rounded-xl p-4">
                      <p className="theme-soft-text text-xs uppercase tracking-[0.16em]">{label}</p>
                      <p className="mt-1 text-lg font-semibold theme-strong-text">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-3">
                  {[
                    'Collect partner details and project scope',
                    'Assign student leads and volunteer roles',
                    'Track hours and publish impact summary',
                  ].map((item) => (
                    <div key={item} className="card flex items-center gap-3 rounded-xl px-4 py-3">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-sky-500" />
                      <span className="theme-strong-text text-sm font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                <div className="card p-6">
                  <p className="theme-soft-text text-sm">Why teams like it</p>
                  <h3 className="mt-3 text-2xl font-semibold">Simple enough to understand. Strong enough to run with.</h3>
                  <p className="theme-soft-text mt-3">
                    The interface keeps the workflow obvious while still giving each role the structure it needs.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ['Students', 'Claim a need and keep the team aligned.'],
                    ['Partners', 'Share a need without designing the whole project.'],
                    ['Advisors', 'Review progress without chasing updates everywhere.'],
                    ['Guest access', 'Test the dashboard without making an account first.'],
                  ].map(([title, copy]) => (
                    <div key={title} className="card p-5">
                      <p className="text-base font-semibold theme-strong-text">{title}</p>
                      <p className="theme-soft-text mt-2 text-sm">{copy}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
