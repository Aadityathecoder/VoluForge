import Link from 'next/link'
import { ArrowRight, CheckCircle2, ClipboardList, FileBarChart, Sparkles, Users, type LucideIcon } from 'lucide-react'

const stepCardClass =
  'glass-panel border-orange-500/15 p-8 lg:p-10 shadow-glass hover:border-orange-400/25 transition-all duration-300'

function StepVisual({ icon: Icon, caption }: { icon: LucideIcon; caption: string }) {
  return (
    <div className="relative flex aspect-[4/3] flex-col items-center justify-center gap-5 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-orange-950/25 p-10 shadow-glass-lg backdrop-blur-sm">
      <div className="rounded-2xl border border-orange-400/20 bg-orange-500/10 p-7 ring-1 ring-orange-400/10">
        <Icon className="h-14 w-14 text-orange-300" aria-hidden />
      </div>
      <p className="text-center text-sm font-medium text-slate-400">{caption}</p>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" aria-hidden />
    </div>
  )
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen pb-24">
      <div className="container-max py-16 lg:py-20">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-50 text-center mb-4">
          How VoluForge works
        </h1>
        <p className="text-xl text-slate-400 text-center mb-16 max-w-2xl mx-auto leading-relaxed">
          From community need to completed project in four simple steps.
        </p>

        <div className="grid gap-16 lg:gap-20 max-w-5xl mx-auto mb-20">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className={stepCardClass}>
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-400 mb-3">Step 1</p>
                <h2 className="text-2xl font-bold text-slate-50 mb-4">Submit a community need</h2>
                <p className="text-slate-400 mb-6 leading-relaxed">
                  A nonprofit, school, or local organization describes what they need help with. This could be anything from assembling hygiene kits to tutoring students to cleaning up a park.
                </p>
                <ul className="space-y-3 text-sm text-slate-400">
                  {['Simple form submission', 'Specify budget, deadline, beneficiaries', 'Immediately visible to student groups'].map((t) => (
                    <li key={t} className="flex gap-2">
                      <CheckCircle2 className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <StepVisual icon={ClipboardList} caption="Partners describe real community needs" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className={stepCardClass}>
              <p className="text-xs font-semibold uppercase tracking-wider text-orange-400 mb-3">Step 2</p>
              <h2 className="text-2xl font-bold text-slate-50 mb-4">VoluForge generates a complete project kit</h2>
              <p className="text-slate-400 mb-6 leading-relaxed">
                Our AI analyzes the need and instantly creates a ready-to-execute project plan with everything your team needs.
              </p>
              <ul className="space-y-3 text-sm text-slate-400">
                {[
                  'Project timeline (phases and tasks)',
                  'Volunteer roles and responsibilities',
                  'Complete materials list and budget',
                  'Outreach emails, flyers, social posts',
                  'Safety considerations and impact metrics',
                ].map((t) => (
                  <li key={t} className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <StepVisual icon={Sparkles} caption="Structured plans from each need" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="order-2 md:order-1">
              <StepVisual icon={Users} caption="Teams execute with clear roles and tasks" />
            </div>
            <div className={`order-1 md:order-2 ${stepCardClass}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-orange-400 mb-3">Step 3</p>
              <h2 className="text-2xl font-bold text-slate-50 mb-4">Student teams execute</h2>
              <p className="text-slate-400 mb-6 leading-relaxed">
                Your club claims the project kit and gets to work. Every team member has clear tasks, timelines, and roles.
              </p>
              <ul className="space-y-3 text-sm text-slate-400">
                {[
                  'Assign volunteers to specific roles',
                  'Track tasks and deadlines',
                  'Log volunteer hours',
                  'Collect impact data (items, hours, people served)',
                ].map((t) => (
                  <li key={t} className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className={stepCardClass}>
              <p className="text-xs font-semibold uppercase tracking-wider text-orange-400 mb-3">Step 4</p>
              <h2 className="text-2xl font-bold text-slate-50 mb-4">Document impact</h2>
              <p className="text-slate-400 mb-6 leading-relaxed">
                At the end, generate a professional impact report showing exactly what you accomplished.
              </p>
              <ul className="space-y-3 text-sm text-slate-400">
                {[
                  'Automated report generation',
                  'Community partner feedback',
                  'Student reflection',
                  'PDF ready for portfolios, college apps',
                ].map((t) => (
                  <li key={t} className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <StepVisual icon={FileBarChart} caption="Impact captured for partners and portfolios" />
            </div>
          </div>
        </div>

        <div className="glass-panel border-white/10 p-10 lg:p-12 mb-16 max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-50 mb-10 text-center">Why VoluForge?</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                title: 'For student leaders',
                points: [
                  'Turn vague ideas into concrete projects',
                  'Get professional materials ready to use',
                  'Know exactly what to do each day',
                  'Prove real-world impact for college apps',
                ],
              },
              {
                title: 'For community partners',
                points: [
                  'Get organized help without doing all the planning',
                  'See detailed project plans before work starts',
                  'Track student progress in real time',
                  'Get measurable impact documentation',
                ],
              },
              {
                title: 'For advisors',
                points: [
                  'Review safety and feasibility before approval',
                  'Monitor project execution from one dashboard',
                  'Ensure proper supervision and permissions',
                  'Celebrate documented student impact',
                ],
              },
            ].map((group) => (
              <div key={group.title}>
                <h3 className="font-semibold text-slate-100 mb-5">{group.title}</h3>
                <ul className="space-y-3">
                  {group.points.map((point) => (
                    <li key={point} className="flex gap-2 text-sm text-slate-400">
                      <CheckCircle2 className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center space-y-8 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-50">Ready to build something that matters?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/explore" className="btn-primary px-8 py-3.5">
              Browse community needs
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/auth/signup" className="btn-secondary px-8 py-3.5">
              Create account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
