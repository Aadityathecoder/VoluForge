import Link from 'next/link'

export function Mark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="11" fill="#DB582C" />
      <path d="M8 13h7l6 17 6-17h7L23 37h-5L8 13Z" fill="#F8F5ED" />
      <path d="M29 13h12v6h-8v5h6v6h-6v7h-6V21l2-8Z" fill="#F8F5ED" />
    </svg>
  )
}

export function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 rounded-md" aria-label="VoluForge home">
      <Mark />
      <span className="font-display text-[21px] font-bold tracking-[-0.03em]">voluforge</span>
    </Link>
  )
}
