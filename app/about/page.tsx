import Image from 'next/image'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="container-max py-16 max-w-3xl">
      <h1 className="text-4xl font-bold text-slate-50 mb-6">About VoluForge</h1>
      <p className="text-slate-400 text-lg mb-10 leading-relaxed">
        VoluForge connects student leaders with real community needs and gives teams the structure to plan, execute, and
        document impact—without starting from a blank page.
      </p>

      <div className="card p-8 md:p-10 mb-10 border-orange-500/15">
        <div className="flex flex-col sm:flex-row gap-8 items-start">
          <div className="shrink-0 mx-auto sm:mx-0">
            <Image
              src="/images/aaditya-mitra.png"
              alt="Aaditya Mitra"
              width={200}
              height={250}
              className="rounded-2xl border border-white/10 object-cover object-top shadow-glass-lg"
              priority
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-50 mb-3">Created by Aaditya Mitra</h2>
            <p className="text-slate-400 leading-relaxed mb-4">
              Aaditya is a sophomore at{' '}
              <span className="text-slate-200">American Heritage Schools</span>. He built VoluForge to make it easier for
              students and community partners to align on meaningful service projects—from the first idea through
              measurable outcomes.
            </p>
            <p className="text-slate-500 text-sm leading-relaxed">
              Have feedback or want your school on VoluForge? Use the product as a signed-in user and share notes with
              your advisor or partner organization.
            </p>
          </div>
        </div>
      </div>

      <Link href="/how-it-works" className="font-medium text-orange-400 hover:text-orange-300 transition-colors">
        See how it works →
      </Link>
    </div>
  )
}
