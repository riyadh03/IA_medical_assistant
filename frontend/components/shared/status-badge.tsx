import { ReactNode } from 'react'

interface StatusBadgeProps {
  status: 'pending' | 'in-progress' | 'completed' | 'review' | 'error'
  children: ReactNode
}

export function StatusBadge({ status, children }: StatusBadgeProps) {
  const statusStyles = {
    pending: 'bg-muted text-muted-foreground',
    'in-progress': 'bg-primary bg-opacity-20 text-primary',
    completed: 'bg-green-500 bg-opacity-20 text-green-700 dark:text-green-400',
    review: 'bg-accent bg-opacity-20 text-accent-foreground',
    error: 'bg-destructive bg-opacity-20 text-destructive',
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}
    >
      {children}
    </span>
  )
}
