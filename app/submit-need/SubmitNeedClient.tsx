'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Visibility } from '@/types/database'

const CATEGORIES = [
  'Education',
  'Environment',
  'Food security',
  'Health',
  'Housing',
  'Seniors',
  'Youth',
  'Arts & culture',
  'Other',
]

export function SubmitNeedClient({ defaultContactName }: { defaultContactName: string }) {
  const router = useRouter()
  const [organizationName, setOrganizationName] = useState('')
  const [contactName, setContactName] = useState(defaultContactName)
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [beneficiaries, setBeneficiaries] = useState('')
  const [estimatedPeople, setEstimatedPeople] = useState('')
  const [location, setLocation] = useState('')
  const [deadline, setDeadline] = useState('')
  const [ageRestrictions, setAgeRestrictions] = useState('')
  const [safetyConcerns, setSafetyConcerns] = useState('')
  const [knownMaterials, setKnownMaterials] = useState('')
  const [budgetEstimate, setBudgetEstimate] = useState('')
  const [preferredProjectType, setPreferredProjectType] = useState('')
  const [visibility, setVisibility] = useState<Visibility>('public')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be signed in.')
        return
      }

      const estimatedPeopleImpacted =
        estimatedPeople.trim() === '' ? null : Number.parseInt(estimatedPeople, 10)
      if (estimatedPeople.trim() !== '' && Number.isNaN(estimatedPeopleImpacted)) {
        setError('Estimated people impacted must be a number.')
        return
      }

      const budgetNum = budgetEstimate.trim() === '' ? null : Number.parseFloat(budgetEstimate)
      if (budgetEstimate.trim() !== '' && Number.isNaN(budgetNum)) {
        setError('Budget estimate must be a number.')
        return
      }

      const { error: insertError } = await supabase.from('community_needs').insert({
        submitted_by: user.id,
        organization_name: organizationName.trim(),
        contact_name: contactName.trim(),
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim() || null,
        category,
        description: description.trim(),
        beneficiaries: beneficiaries.trim(),
        estimated_people_impacted: estimatedPeopleImpacted,
        location: location.trim(),
        deadline: deadline.trim() || null,
        age_restrictions: ageRestrictions.trim() || null,
        safety_concerns: safetyConcerns.trim() || null,
        known_materials: knownMaterials.trim() || null,
        budget_estimate: budgetNum,
        preferred_project_type: preferredProjectType.trim() || null,
        visibility,
        status: 'open',
      })

      if (insertError) {
        setError(insertError.message)
        return
      }

      setDone(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setIsLoading(false)
    }
  }

  if (done) {
    return (
      <div className="container-max py-16 max-w-xl">
        <div className="card p-8 border-emerald-500/20">
          <div className="flex gap-3 mb-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <div>
              <h1 className="text-xl font-semibold text-slate-50 mb-2">Need submitted</h1>
              <p className="text-slate-400 leading-relaxed">
                Your request is live for eligible student accounts to discover. You can share the explore page with
                schools you work with.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/explore" className="btn-primary text-sm">
              View explore
            </Link>
            <Link href="/dashboard" className="btn-secondary text-sm">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-max py-12 max-w-3xl pb-20">
      <h1 className="text-3xl font-bold text-slate-50 mb-2">Submit a community need</h1>
      <p className="text-slate-400 mb-10 leading-relaxed">
        Describe what would help your organization. Student teams use this to scope projects and generate structured plans.
      </p>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-8 card p-8 lg:p-10">
        {error && (
          <div className="rounded-xl border border-red-400/25 bg-red-500/10 p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Organization</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label-text">Organization name</label>
              <input
                className="input-field"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label-text">Primary contact name</label>
              <input className="input-field" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
            </div>
            <div>
              <label className="label-text">Contact email</label>
              <input
                type="email"
                className="input-field"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label-text">Contact phone (optional)</label>
              <input className="input-field" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Need details</h2>
          <div>
            <label className="label-text">Category</label>
            <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-text">Describe the need</label>
            <textarea
              className="input-field min-h-[120px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label-text">Who benefits?</label>
            <textarea
              className="input-field min-h-[80px]"
              value={beneficiaries}
              onChange={(e) => setBeneficiaries(e.target.value)}
              required
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label-text">Location (city / region)</label>
              <input className="input-field" value={location} onChange={(e) => setLocation(e.target.value)} required />
            </div>
            <div>
              <label className="label-text">Estimated people impacted (optional)</label>
              <input
                className="input-field"
                inputMode="numeric"
                value={estimatedPeople}
                onChange={(e) => setEstimatedPeople(e.target.value)}
              />
            </div>
            <div>
              <label className="label-text">Target deadline (optional)</label>
              <input className="input-field" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <div>
              <label className="label-text">Preferred project type (optional)</label>
              <input
                className="input-field"
                placeholder="e.g. Drive, workshop series, build day"
                value={preferredProjectType}
                onChange={(e) => setPreferredProjectType(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label-text">Visibility</label>
            <div className="flex flex-wrap gap-3 mt-2">
              {(
                [
                  { value: 'public' as Visibility, label: 'Public', hint: 'Visible broadly to eligible accounts' },
                  { value: 'local' as Visibility, label: 'Local', hint: 'Prominent for student discovery in-network' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setVisibility(opt.value)}
                  className={`text-left rounded-xl border px-4 py-3 text-sm transition-all max-w-xs ${
                    visibility === opt.value
                      ? 'border-orange-400/50 bg-orange-500/15 text-orange-50'
                      : 'border-white/12 bg-white/[0.03] text-slate-400 hover:border-white/20'
                  }`}
                >
                  <span className="font-medium block">{opt.label}</span>
                  <span className="text-xs text-slate-500">{opt.hint}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Logistics & safety</h2>
          <div>
            <label className="label-text">Known materials or resources (optional)</label>
            <textarea className="input-field min-h-[72px]" value={knownMaterials} onChange={(e) => setKnownMaterials(e.target.value)} />
          </div>
          <div>
            <label className="label-text">Budget estimate, USD (optional)</label>
            <input className="input-field" inputMode="decimal" value={budgetEstimate} onChange={(e) => setBudgetEstimate(e.target.value)} />
          </div>
          <div>
            <label className="label-text">Age restrictions or volunteer requirements (optional)</label>
            <textarea className="input-field min-h-[72px]" value={ageRestrictions} onChange={(e) => setAgeRestrictions(e.target.value)} />
          </div>
          <div>
            <label className="label-text">Safety considerations (optional)</label>
            <textarea className="input-field min-h-[72px]" value={safetyConcerns} onChange={(e) => setSafetyConcerns(e.target.value)} />
          </div>
        </section>

        <button type="submit" disabled={isLoading} className="w-full btn-primary py-3.5 disabled:opacity-50">
          {isLoading ? 'Submitting…' : 'Submit need'}
        </button>
      </form>
    </div>
  )
}
