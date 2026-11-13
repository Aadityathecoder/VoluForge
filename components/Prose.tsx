import { SiteHeader } from './SiteHeader'
import { SiteFooter } from './SiteFooter'

export function ProsePage({ title, updated, children }: { title: string; updated?: string; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="page flex-1 py-14">
        <article className="max-w-[68ch] [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_li]:mt-1.5 [&_p]:mt-4 [&_p]:leading-relaxed [&_p]:text-ink/85 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-ink/85">
          <h1 className="h-page">{title}</h1>
          {updated && <p className="!mt-2 text-sm !text-muted">Last updated {updated}</p>}
          {children}
        </article>
      </main>
      <SiteFooter />
    </>
  )
}
