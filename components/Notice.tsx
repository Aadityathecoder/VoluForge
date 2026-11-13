export function Notice({ tone = 'info', children }: { tone?: 'info' | 'error' | 'success'; children: React.ReactNode }) {
  const styles = { info: 'border-line bg-soft', error: 'border-danger/30 bg-peach/60 text-danger', success: 'border-forest/20 bg-sage text-forest' }[tone]
  return <p role={tone === 'error' ? 'alert' : 'status'} className={`rounded-md border px-4 py-3 text-sm ${styles}`}>{children}</p>
}
