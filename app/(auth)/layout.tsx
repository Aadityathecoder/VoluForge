import Link from 'next/link'
import { Logo } from '@/components/Logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_minmax(0,520px)]">
      <div className="flex flex-col px-4 py-6 sm:px-10">
        <Logo />
        <main className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-12">{children}</main>
        <p className="text-xs text-muted"><Link href="/privacy" className="hover:text-ink">Privacy</Link> · <Link href="/terms" className="hover:text-ink">Terms</Link></p>
      </div>
      <aside className="hidden flex-col justify-end bg-forest p-12 text-cream lg:flex" aria-hidden="true">
        <p className="font-display text-[2.6rem] font-bold leading-[1.02] tracking-[-0.03em]">A little time.<br />A lot of good.</p>
        <p className="mt-5 max-w-sm text-cream/75">Fellowships and volunteer work for students, run by the schools and organizations that know them.</p>
      </aside>
    </div>
  )
}
