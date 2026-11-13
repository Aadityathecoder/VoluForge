import Link from 'next/link'
import { Logo } from './Logo'
import { getViewer, homeFor } from '@/lib/viewer'

export async function SiteHeader() {
  const viewer = await getViewer()
  return (
    <header className="border-b border-line bg-cream/95">
      <div className="page flex h-16 items-center justify-between gap-6">
        <Logo />
        <nav className="hidden items-center gap-7 text-[15px] font-medium text-ink/80 md:flex" aria-label="Main">
          <Link href="/#students" className="hover:text-ink">Students</Link>
          <Link href="/#administrators" className="hover:text-ink">Administrators</Link>
          <Link href="/#how-it-works" className="hover:text-ink">How it works</Link>
          <Link href="/support" className="hover:text-ink">Support</Link>
        </nav>
        <div className="flex items-center gap-2">
          {viewer ? (
            <Link href={homeFor(viewer)} className="btn-primary btn-sm whitespace-nowrap">Open VoluForge</Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-sm whitespace-nowrap px-2.5 text-ink hover:bg-soft sm:px-3.5">Sign in</Link>
              <Link href="/signup" className="btn-primary btn-sm whitespace-nowrap"><span className="sm:hidden">Join</span><span className="hidden sm:inline">Create account</span></Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
