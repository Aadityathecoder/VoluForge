'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function Navbar() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [guestMode, setGuestMode] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    setGuestMode(document.cookie.includes('voluforge-guest=1'))

    supabase.auth.getUser().then(({ data }: any) => {
      setUser(data.user ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    await fetch('/api/guest', { method: 'DELETE' })
    router.refresh()
    router.push('/')
    setIsOpen(false)
    setGuestMode(false)
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/55 shadow-nav backdrop-blur-2xl supports-[backdrop-filter]:bg-white/45 dark:border-white/10 dark:bg-slate-950/35">
      <div className="mx-auto max-w-7xl px-2 sm:px-3 lg:px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight theme-strong-text">
            <Image
              src="/branding/voluforge-logo.png"
              alt="VoluForge logo"
              width={44}
              height={44}
              className="h-11 w-11 object-cover"
              priority
            />
            <div>
              <span className="block text-[1.05rem] leading-none">VoluForge</span>
              <span className="theme-soft-text mt-0.5 hidden text-[10px] font-medium uppercase tracking-[0.22em] md:block">
                Student service workflow
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/explore"
              className="theme-soft-text text-sm transition-colors hover:text-sky-500"
            >
              Browse Needs
            </Link>
            <Link
              href="/how-it-works"
              className="theme-soft-text text-sm transition-colors hover:text-sky-500"
            >
              How It Works
            </Link>
            <Link
              href="/about"
              className="theme-soft-text text-sm transition-colors hover:text-sky-500"
            >
              About
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user || guestMode ? (
              <>
                <Link href="/dashboard" className="btn-ghost text-sm">
                  Dashboard
                </Link>
                <button type="button" onClick={() => void signOut()} className="btn-secondary text-sm px-5">
                  {user ? 'Sign out' : 'Exit guest'}
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="btn-ghost text-sm">
                  Sign In
                </Link>
                <Link href="/auth/signup" className="btn-primary text-sm px-5">
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="theme-soft-text rounded-xl p-2 transition-colors hover:bg-black/5 md:hidden dark:hover:bg-white/10"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {isOpen && (
          <div className="glass-panel mx-0 mb-4 border-white/10 py-4 md:hidden">
            <div className="flex flex-col gap-1 px-2">
              <Link
                href="/explore"
                className="theme-soft-text block rounded-lg px-4 py-2.5 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                onClick={() => setIsOpen(false)}
              >
                Browse Needs
              </Link>
              <Link
                href="/how-it-works"
                className="theme-soft-text block rounded-lg px-4 py-2.5 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                onClick={() => setIsOpen(false)}
              >
                How It Works
              </Link>
              <Link
                href="/about"
                className="theme-soft-text block rounded-lg px-4 py-2.5 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                onClick={() => setIsOpen(false)}
              >
                About
              </Link>
              <div className="divider my-2" />
              {user || guestMode ? (
                <>
                  <Link
                    href="/dashboard"
                    className="theme-soft-text block rounded-lg px-4 py-2.5 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    className="btn-secondary mx-2 mt-2 justify-center text-center"
                    onClick={() => void signOut()}
                  >
                    {user ? 'Sign out' : 'Exit guest'}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="block rounded-lg px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/10"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="btn-primary mx-2 mt-2 justify-center text-center"
                    onClick={() => setIsOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
