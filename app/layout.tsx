import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'

// Fonts ship with the site so builds never depend on reaching Google Fonts.
const display = localFont({
  variable: '--font-display',
  src: [
    { path: './fonts/BricolageGrotesque-700.ttf', weight: '700' },
    { path: './fonts/BricolageGrotesque-800.ttf', weight: '800' },
  ],
})
const body = localFont({ variable: '--font-body', src: './fonts/DMSans.ttf', weight: '100 900' })

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
