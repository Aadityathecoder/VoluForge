import Link from 'next/link'
import { Mark } from './Logo'

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="page flex flex-col gap-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5"><Mark size={22} /><span>VoluForge. A little time, a lot of good.</span></div>
        <nav className="flex gap-5" aria-label="Footer">
          <Link href="/privacy" className="hover:text-ink">Privacy</Link>
          <Link href="/terms" className="hover:text-ink">Terms</Link>
          <Link href="/support" className="hover:text-ink">Support</Link>
        </nav>
      </div>
    </footer>
  )
}
