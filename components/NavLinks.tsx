'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavLinks({ links, mobile = false }: { links: { href: string; label: string }[]; mobile?: boolean }) {
  const path = usePathname()
  const active = (href: string) => {
    const best = links.filter(l => path === l.href || path.startsWith(l.href + '/')).sort((a, b) => b.href.length - a.href.length)[0]
    return best?.href === href
  }
  return (
    <nav aria-label="App" className={mobile ? 'flex gap-1' : 'hidden h-16 items-stretch gap-6 md:flex'}>
      {links.map(l => (
        <Link key={l.href} href={l.href} aria-current={active(l.href) ? 'page' : undefined}
          className={mobile
            ? `whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${active(l.href) ? 'bg-ink text-paper' : 'text-ink/75'}`
            : `flex items-center border-b-2 text-[15px] font-medium ${active(l.href) ? 'border-ember text-ink' : 'border-transparent text-ink/65 hover:text-ink'}`}>
          {l.label}
        </Link>
      ))}
    </nav>
  )
}
