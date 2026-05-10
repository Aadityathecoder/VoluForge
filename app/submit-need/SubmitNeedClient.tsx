'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, Camera, CheckCircle2, LoaderCircle, ScanSearch, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  calculateBookMatchScore,
  cropForBookFocus,
  extractFeaturesFromImageData,
  getSampleSize,
  type MatchFeatures,
} from '@/lib/itemRecognition'
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

export function SubmitNeedClient({
  defaultContactName,
  demoMode = false,
}: {
  defaultContactName: string
  demoMode?: boolean
}) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const matchIntervalRef = useRef<number | null>(null)
  const referenceFeaturesRef = useRef<MatchFeatures | null>(null)
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
  const [cameraError, setCameraError] = useState('')
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [capturedImage, setCapturedImage] = useState('')
  const [liveConfidence, setLiveConfidence] = useState<number | null>(null)
  const [recognitionLabel, setRecognitionLabel] = useState('')
  const [recognitionSummary, setRecognitionSummary] = useState('')
  const [recognitionConfidence, setRecognitionConfidence] = useState<number | null>(null)
  const [isRecognizing, setIsRecognizing] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    void loadReferenceFeatures()

    return () => {
      stopMatchingLoop()
      stopCamera()
    }
  }, [])

  function stopMatchingLoop() {
    if (matchIntervalRef.current !== null) {
      window.clearInterval(matchIntervalRef.current)
      matchIntervalRef.current = null
    }
  }

  function stopCamera() {
    stopMatchingLoop()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraEnabled(false)
  }

  async function loadReferenceFeatures() {
    if (referenceFeaturesRef.current) return

    const image = new Image()
    image.src = '/reference/ap-world-history-book.jpg'

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('Reference image failed to load.'))
    })

    const canvas = document.createElement('canvas')
    const { width, height } = getSampleSize()
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Reference image analysis is unavailable.')
    }

    cropForBookFocus(context, image, image.naturalWidth, image.naturalHeight)
    const imageData = context.getImageData(0, 0, width, height)
    referenceFeaturesRef.current = extractFeaturesFromImageData(imageData)
  }

  function startMatchingLoop() {
    stopMatchingLoop()

    matchIntervalRef.current = window.setInterval(() => {
      if (!videoRef.current || !analysisCanvasRef.current || !referenceFeaturesRef.current) {
        return
      }

      const video = videoRef.current
      if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
        return
      }

      const canvas = analysisCanvasRef.current
      const { width, height } = getSampleSize()
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')
      if (!context) {
        return
      }

      cropForBookFocus(context, video, video.videoWidth, video.videoHeight)
      const frameData = context.getImageData(0, 0, width, height)
      const frameFeatures = extractFeaturesFromImageData(frameData)
      const score = calculateBookMatchScore(frameFeatures, referenceFeaturesRef.current)
      setLiveConfidence(score)
    }, 350)
  }

  async function startCamera() {
    setCameraError('')
    setCapturedImage('')
    setRecognitionLabel('')
    setRecognitionSummary('')
    setRecognitionConfidence(null)

    try {
      await loadReferenceFeatures()
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
        },
        audio: false,
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraEnabled(true)
      startMatchingLoop()
    } catch (err) {
      setCameraError(err instanceof Error ? err.message : 'Camera access failed.')
    }
  }

  async function captureAndRecognize() {
    if (!videoRef.current || !canvasRef.current || !analysisCanvasRef.current || !referenceFeaturesRef.current) {
      setCameraError('Camera preview is not ready yet.')
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720

    const context = canvas.getContext('2d')
    if (!context) {
      setCameraError('Unable to read the camera frame.')
      return
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setCapturedImage(imageDataUrl)
    setIsRecognizing(true)
    setCameraError('')

    try {
      const analysisCanvas = analysisCanvasRef.current
      const analysisContext = analysisCanvas.getContext('2d')
      if (!analysisContext) {
        throw new Error('Recognition analysis is unavailable.')
      }

      const { width, height } = getSampleSize()
      analysisCanvas.width = width
      analysisCanvas.height = height
      cropForBookFocus(analysisContext, video, video.videoWidth, video.videoHeight)
      const frameData = analysisContext.getImageData(0, 0, width, height)
      const frameFeatures = extractFeaturesFromImageData(frameData)
      const confidence = calculateBookMatchScore(frameFeatures, referenceFeaturesRef.current)
      const isMatch = confidence >= 0.72
      const label = isMatch ? 'AP World History book' : 'Uncertain item'
      const summary = isMatch
        ? 'Live camera matching found a strong similarity to the reference AP World History book cover.'
        : 'The current frame does not look close enough to the AP World History reference cover yet. Center the book and reduce glare.'

      setRecognitionLabel(label)
      setRecognitionSummary(summary)
      setRecognitionConfidence(confidence)
      if (isMatch) {
        setCategory('Education')
        setDescription((current) =>
          current.trim() === '' ? `Donation item recognized: ${label}. ${summary}` : current
        )
        setKnownMaterials((current) => (current.trim() === '' ? label : current))
      }
      stopCamera()
    } catch (err) {
      setCameraError(err instanceof Error ? err.message : 'Recognition failed.')
    } finally {
      setIsRecognizing(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (demoMode) {
      setError('Demo mode is enabled on this page. Camera recognition works, but real submission requires a partner account.')
      return
    }

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

      {demoMode && (
        <div className="mb-8 rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4">
          <p className="text-sm font-medium text-sky-100">Demo mode</p>
          <p className="mt-1 text-sm text-sky-50/90">
            The camera recognition feature is live for testing here. Real community-need submission still requires a
            signed-in partner account.
          </p>
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-8 card p-8 lg:p-10">
        {error && (
          <div className="rounded-xl border border-red-400/25 bg-red-500/10 p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Item recognition</h2>
          <div className="card rounded-[1.5rem] p-5">
            <div className="flex flex-col gap-5 lg:flex-row">
              <div className="flex-1">
                <p className="theme-strong-text text-lg font-semibold">Use your camera to identify a donated item</p>
                <p className="mt-2 text-sm theme-soft-text">
                  The current MVP is wired for one recognition target: your AP World History book. While the camera is
                  on, the app continuously compares the live frame against your reference cover image and updates the
                  confidence score in real time.
                </p>

                {cameraEnabled && liveConfidence !== null && (
                  <div className="mt-4 rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4">
                    <p className="text-sm font-semibold text-sky-100">Live match confidence</p>
                    <p className="mt-1 text-2xl font-semibold theme-strong-text">{(liveConfidence * 100).toFixed(0)}%</p>
                    <p className="mt-2 text-sm text-sky-50/90">
                      Hold the book upright in the center of the frame. The score should rise as the cover layout and
                      colors line up with the reference image.
                    </p>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-3">
                  {!cameraEnabled ? (
                    <button type="button" onClick={() => void startCamera()} className="btn-primary text-sm">
                      <Camera className="h-4 w-4" />
                      Turn on camera
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => void captureAndRecognize()}
                        className="btn-primary text-sm"
                        disabled={isRecognizing}
                      >
                        {isRecognizing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
                        {isRecognizing ? 'Recognizing item...' : 'Capture and identify'}
                      </button>
                      <button type="button" onClick={stopCamera} className="btn-secondary text-sm">
                        <XCircle className="h-4 w-4" />
                        Stop camera
                      </button>
                    </>
                  )}
                </div>

                {cameraError && (
                  <div className="mt-4 rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-200">
                    {cameraError}
                  </div>
                )}

                {recognitionLabel && (
                  <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                    <p className="text-sm font-semibold text-emerald-100">Detected item</p>
                    <p className="mt-1 theme-strong-text text-lg font-semibold">{recognitionLabel}</p>
                    <p className="mt-2 text-sm text-emerald-50/90">{recognitionSummary}</p>
                    {recognitionConfidence !== null && (
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-emerald-100/80">
                        Confidence {(recognitionConfidence * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="camera-shell flex min-h-[280px] items-center justify-center overflow-hidden rounded-[1.5rem] p-3">
                  {capturedImage ? (
                    <img src={capturedImage} alt="Captured donation item" className="h-full max-h-[320px] w-full rounded-[1.1rem] object-cover" />
                  ) : (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`h-full max-h-[320px] w-full rounded-[1.1rem] object-cover ${cameraEnabled ? 'block' : 'hidden'}`}
                    />
                  )}

                  {!cameraEnabled && !capturedImage && (
                    <div className="flex max-w-xs flex-col items-center text-center">
                      <Camera className="h-8 w-8 theme-soft-text" />
                      <p className="mt-3 text-sm theme-soft-text">
                        Start the camera to preview your donated item before recognition runs.
                      </p>
                    </div>
                  )}
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <canvas ref={analysisCanvasRef} className="hidden" />
              </div>
            </div>
          </div>
        </section>

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
