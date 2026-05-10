import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { SiteAssistant } from '@/components/layout/SiteAssistant'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

export const viewport: Viewport = {
  themeColor: '#1f2937',
}

export const metadata: Metadata = {
  title: 'VoluForge - Turn Community Needs Into Student-Led Action',
  description:
    'VoluForge helps schools, clubs, and local organizations transform real community needs into organized service projects, complete with plans, roles, timelines, and impact reports.',
  keywords: [
    'student service',
    'community service',
    'volunteer projects',
    'student leadership',
  ],
  authors: [{ name: 'Aaditya Mitra' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://voluforge.com',
    siteName: 'VoluForge',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="antialiased">
      <body className="theme-page relative min-h-screen font-sans">
        <Navbar />
        {children}
        <div className="theme-floating">
          <SiteAssistant />
          <ThemeToggle />
        </div>
      </body>
    </html>
  )
}
