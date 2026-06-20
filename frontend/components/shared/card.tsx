import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
  subtitle?: string
}

export function Card({ children, className = '', title, subtitle }: CardProps) {
  return (
    <div
      className={`bg-card border border-border rounded-lg p-6 ${className}`}
    >
      {title && (
        <div className="mb-4 pb-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
