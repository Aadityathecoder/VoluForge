const tz = { timeZone: 'UTC' } as const
export const fmtDate = (d: string | null | undefined, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) =>
  d ? new Date(d.length === 10 ? d + 'T00:00:00Z' : d).toLocaleDateString('en-US', d.length === 10 ? { ...opts, ...tz } : opts) : ''
export const fmtRange = (a: string, b: string) => `${fmtDate(a, { month: 'short', day: 'numeric' })} to ${fmtDate(b)}`
export const fmtTime = (d: string) => new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
export const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`
