import Link from 'next/link'
import { Logo } from './Logo'
import { NavLinks } from './NavLinks'
import type { Viewer } from '@/lib/viewer'
import { signOut } from '@/app/actions/auth'

const studentLinks = [
  { href: '/home', label: 'Home' },
  { href: '/fellowships', label: 'Fellowships' },
  { href: '/opportunities', label: 'Opportunities' },
  { href: '/activity', label: 'My activity' },
]
const adminLinks = [
  { href: '/admin', label: 'Fellowships' },
  { href: '/admin/fellowships/new', label: 'New fellowship' },
]

export function AppHeader({ viewer }: { viewer: Viewer }) {
  const links = viewer.accountType === 'admin' ? adminLinks : studentLinks
  const initials = (viewer.fullName || viewer.email).split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-cream/95 backdrop-blur-sm">
      <div className="page flex h-16 items-center gap-8">
        <Logo href={viewer.accountType === 'admin' ? '/admin' : '/home'} />
        {viewer.accountType === 'admin' && <span className="tag -ml-5 hidden bg-ink text-paper sm:inline-flex">Administrator</span>}
        <NavLinks links={links} />
        <details className="relative ml-auto">
          <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-md py-1 pl-1 pr-2 hover:bg-soft [&::-webkit-details-marker]:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-peach text-xs font-bold" aria-hidden="true">{initials || 'V'}</span>
            <span className="hidden max-w-40 truncate text-sm font-medium sm:block">{viewer.fullName || viewer.email}</span>
          </summary>
          <div className="absolute right-0 mt-2 w-60 rounded-lg border border-line bg-paper p-1.5 shadow-[0_12px_32px_-12px_rgba(25,27,22,.25)]">
            <p className="truncate px-3 py-2 text-xs text-muted">{viewer.email}</p>
            <Link href="/profile" className="block rounded-md px-3 py-2 text-sm hover:bg-soft">Profile and settings</Link>
            <Link href="/support" className="block rounded-md px-3 py-2 text-sm hover:bg-soft">Help</Link>
            <form action={signOut}><button className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-soft">Sign out</button></form>
          </div>
        </details>
      </div>
      <div className="page -mt-1 flex gap-1 overflow-x-auto pb-2 md:hidden"><NavLinks links={links} mobile /></div>
    </header>
  )
}
