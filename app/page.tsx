import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

const sheet = [
  { seat: 1, who: 'Accepted', tone: 'bg-sage text-forest' },
  { seat: 2, who: 'Accepted', tone: 'bg-sage text-forest' },
  { seat: 3, who: 'Accepted', tone: 'bg-sage text-forest' },
  { seat: 4, who: 'Waiting for review', tone: 'bg-peach text-ink' },
  { seat: 5, who: 'Open', tone: 'bg-transparent text-muted border border-dashed border-line' },
  { seat: 6, who: 'Open', tone: 'bg-transparent text-muted border border-dashed border-line' },
]

const steps = [
  { title: 'An administrator creates the fellowship', body: 'Title, dates, weekly hours, how many seats. Keep it as a draft until it is ready.' },
  { title: 'Students find it and apply', body: 'Verified hosts appear in the public directory. Anyone else can share a join code with their students.' },
  { title: 'The administrator picks the cohort', body: 'Read each application, accept or decline with a note, and watch the seats fill.' },
  { title: 'Fellows get to work', body: 'Accepted students see the fellowship on their home page and log their service alongside it.' },
]

export default function Landing() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="page grid items-center gap-12 pb-20 pt-14 lg:grid-cols-[1.1fr_.9fr] lg:pt-20">
          <div>
            <h1 className="font-display text-[clamp(2.8rem,6.4vw,5.6rem)] font-extrabold leading-[.95] tracking-[-0.035em]">
              Give your time where it counts.
            </h1>
            <p className="mt-7 max-w-[34rem] text-lg leading-relaxed text-ink/75">
              VoluForge connects students with volunteer work and with fellowships run by their schools and community
              organizations. Students apply in a few minutes. Administrators run the whole cohort from one place.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/signup" className="btn-primary px-6">Create a student account</Link>
              <Link href="/signup?role=admin" className="btn-outline px-6">I run a fellowship</Link>
            </div>
            <p className="mt-5 text-sm text-muted">Free for students. Sign in with Google or email.</p>
          </div>

          <figure aria-label="Example fellowship sign-up sheet" className="relative mr-2 mt-2 sm:mr-3 sm:mt-3">
            <div className="absolute -right-2 -top-2 h-full w-full rounded-lg bg-ember sm:-right-3 sm:-top-3" aria-hidden="true" />
            <div className="relative rounded-lg border border-ink bg-paper">
              <div className="border-b border-ink px-6 pb-4 pt-5">
                <p className="text-sm font-medium text-muted">Harbor Learning Lab</p>
                <p className="mt-1 font-display text-2xl font-bold tracking-[-0.02em]">Saturday Reading Fellowship</p>
                <p className="mt-2 text-sm text-ink/70">Jan 10 to Mar 28 · 3 hours a week · In person</p>
              </div>
              <ol className="divide-y divide-line">
                {sheet.map(row => (
                  <li key={row.seat} className="flex items-center gap-4 px-6 py-3">
                    <span className="w-14 text-sm tabular-nums text-muted">Seat {row.seat}</span>
                    <span className={`tag ${row.tone}`}>{row.who}</span>
                  </li>
                ))}
              </ol>
              <div className="flex items-center justify-between border-t border-ink px-6 py-4">
                <span className="text-sm"><b className="font-semibold">2 seats</b> left</span>
                <span className="text-sm font-semibold text-ember">Apply by Jan 5</span>
              </div>
            </div>
            <figcaption className="mt-5 text-center text-xs text-muted">An example fellowship as students see it.</figcaption>
          </figure>
        </section>

        <section id="students" className="border-t border-line bg-paper">
          <div className="page grid gap-10 py-16 md:grid-cols-[.8fr_1.2fr]">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-[-0.02em]">For students</h2>
              <p className="mt-3 max-w-sm text-ink/70">Find something worth showing up for, and keep a record of what you did.</p>
            </div>
            <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
              <div><dt className="font-semibold">Join fellowships</dt><dd className="mt-1.5 text-ink/70">Browse open cohorts from verified hosts, or enter the join code your teacher or coordinator gave you.</dd></div>
              <div><dt className="font-semibold">Apply with a short note</dt><dd className="mt-1.5 text-ink/70">Tell the host why you want in. You will see when they accept you, right on your home page.</dd></div>
              <div><dt className="font-semibold">Find volunteer shifts</dt><dd className="mt-1.5 text-ink/70">Search one-off opportunities from verified community organizations near you or online.</dd></div>
              <div><dt className="font-semibold">Track approved hours</dt><dd className="mt-1.5 text-ink/70">Hours only count once an organizer approves them, so your record holds up.</dd></div>
            </dl>
          </div>
        </section>

        <section id="administrators" className="border-t border-line">
          <div className="page grid gap-10 py-16 md:grid-cols-[.8fr_1.2fr]">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-[-0.02em]">For administrators</h2>
              <p className="mt-3 max-w-sm text-ink/70">Teachers, counselors and program leads: run a fellowship without the spreadsheet.</p>
              <Link href="/signup?role=admin" className="btn-ember mt-6">Create an administrator account</Link>
            </div>
            <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
              <div><dt className="font-semibold">Create fellowships</dt><dd className="mt-1.5 text-ink/70">Set the focus, dates, weekly hours, seats and application deadline. Save drafts until you are ready.</dd></div>
              <div><dt className="font-semibold">Control who can apply</dt><dd className="mt-1.5 text-ink/70">Every fellowship has a join code. Once VoluForge verifies your account, open fellowships also appear publicly.</dd></div>
              <div><dt className="font-semibold">Review applicants</dt><dd className="mt-1.5 text-ink/70">See each student's school, skills and note. Accept or decline with a message they can read.</dd></div>
              <div><dt className="font-semibold">Keep seats honest</dt><dd className="mt-1.5 text-ink/70">Capacity is enforced for you, and students who withdraw free up their seat straight away.</dd></div>
            </dl>
          </div>
        </section>

        <section id="how-it-works" className="border-t border-line bg-forest text-cream">
          <div className="page py-16">
            <h2 className="font-display text-3xl font-bold tracking-[-0.02em]">How a fellowship runs</h2>
            <ol className="mt-10 grid gap-8 md:grid-cols-4">
              {steps.map((s, i) => (
                <li key={s.title} className="border-t border-cream/30 pt-5">
                  <span className="font-display text-4xl font-bold text-sage">{i + 1}</span>
                  <h3 className="mt-3 font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-cream/75">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="page flex flex-col items-start justify-between gap-6 py-16 sm:flex-row sm:items-center">
          <p className="max-w-xl font-display text-3xl font-bold leading-tight tracking-[-0.02em]">Ready when you are. It takes about a minute to set up.</p>
          <div className="flex gap-3"><Link href="/signup" className="btn-primary">Create account</Link><Link href="/login" className="btn-quiet">Sign in</Link></div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
