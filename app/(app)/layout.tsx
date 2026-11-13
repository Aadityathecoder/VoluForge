import { AppHeader } from '@/components/AppHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { requireViewer } from '@/lib/viewer'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireViewer()
  return (
    <>
      <AppHeader viewer={viewer} />
      <main className="page flex-1 py-10">{children}</main>
      <SiteFooter />
    </>
  )
}
