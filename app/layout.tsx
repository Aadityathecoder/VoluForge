import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google'
import './globals.css'

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display', weight: ['500', '600', '700', '800'] })
const body = DM_Sans({ subsets: ['latin'], variable: '--font-body' })

export const metadata: Metadata = {
  metadataBase: new URL('https://voluforge.xyz'),
  title: { default: 'VoluForge: volunteering and fellowships for students', template: '%s · VoluForge' },
  description: 'Students find volunteer work and join fellowships run by their schools and community organizations. Administrators create fellowships and manage every applicant in one place.',
  openGraph: { siteName: 'VoluForge', type: 'website' },
}
export const viewport: Viewport = { themeColor: '#F8F5ED' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="flex min-h-screen flex-col bg-cream font-sans text-ink">{children}</body>
    </html>
  )
}
