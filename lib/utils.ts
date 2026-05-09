import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | null | undefined): string {
  if (!amount) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return 'No date'
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return 'Invalid date'
  }
}

export function formatDaysUntil(deadline: string | null | undefined): string {
  if (!deadline) return 'No deadline'
  try {
    const today = new Date()
    const end = new Date(deadline)
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return 'Overdue'
    if (diff === 0) return 'Due today'
    if (diff === 1) return 'Due tomorrow'
    return `${diff} days left`
  } catch {
    return 'Invalid deadline'
  }
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function estimateReadTime(text: string): number {
  const wordsPerMinute = 200
  const words = text.trim().split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}
