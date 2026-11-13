import Link from 'next/link'
export default function NotFound() {
  return (
    <main className="page flex flex-1 flex-col items-start justify-center py-24">
      <h1 className="h-page">That page isn't here</h1>
      <p className="mt-3 text-ink/70">It may have moved, or the fellowship was closed by its administrator.</p>
      <Link href="/" className="btn-primary mt-8">Go to VoluForge</Link>
    </main>
  )
}
