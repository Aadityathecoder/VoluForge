'use client'
import { useFormStatus } from 'react-dom'

export function SubmitButton({ children, pending, className = 'btn-primary', name, value, formAction }: {
  children: React.ReactNode; pending?: string; className?: string; name?: string; value?: string
  formAction?: (formData: FormData) => void | Promise<void>
}) {
  const status = useFormStatus()
  return (
    <button type="submit" className={className} disabled={status.pending} name={name} value={value} formAction={formAction} aria-busy={status.pending}>
      {status.pending && pending ? pending : children}
    </button>
  )
}
