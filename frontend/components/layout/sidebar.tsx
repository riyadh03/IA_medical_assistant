'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Activity,
  ClipboardList,
  FileText,
  Home,
  MessageSquare,
  Settings,
  CheckCircle2,
  Stethoscope,
} from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()

  const links = [
    { href: '/', icon: Home, label: 'Dashboard' },
    { href: '/consultation/create', icon: ClipboardList, label: 'New Consultation' },
    {
      href: '/consultation/interview',
      icon: MessageSquare,
      label: 'Patient Interview',
    },
    {
      href: '/consultation/clinical-summary',
      icon: Stethoscope,
      label: 'Clinical Summary',
    },
    {
      href: '/consultation/physician-review',
      icon: Activity,
      label: 'Physician Review',
    },
    {
      href: '/consultation/final-report',
      icon: FileText,
      label: 'Final Report',
    },
  ]

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-sidebar-foreground text-sm">
              Clinical AI
            </h1>
            <p className="text-xs text-muted-foreground">Orientation System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:bg-opacity-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{link.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:bg-opacity-50 transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium">Settings</span>
        </Link>
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-muted-foreground mb-2">
          This system does not replace a medical consultation.
        </p>
      </div>
    </aside>
  )
}
