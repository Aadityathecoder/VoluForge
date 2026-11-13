import type { Metadata } from 'next'
import Link from 'next/link'
import { requireViewer } from '@/lib/viewer'
import { FellowshipForm } from '@/components/FellowshipForm'
import { Notice } from '@/components/Notice'

export const metadata: Metadata = { title: 'New fellowship' }
export default async function NewFellowship({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireViewer('admin')
  const { error } = await searchParams
  return (
    <div className="max-w-3xl">
      <Link href="/admin" className="text-sm text-muted hover:text-ink">← Your fellowships</Link>
      <h1 className="h-page mt-4">New fellowship</h1>
      <p className="mt-2 text-ink/70">Students see everything here except the join code. You can edit it any time.</p>
      {error && <div className="mt-6"><Notice tone="error">{error}</Notice></div>}
      <div className="mt-8"><FellowshipForm /></div>
    </div>
  )
}
