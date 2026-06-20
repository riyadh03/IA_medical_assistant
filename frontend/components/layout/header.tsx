'use client'

interface HeaderProps {
  title?: string
  subtitle?: string
}

export function Header({ title = 'Clinical Orientation System', subtitle }: HeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="px-6 py-4">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    </header>
  )
}
