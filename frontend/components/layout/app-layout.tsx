'use client'

import React, { ReactNode } from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'

interface AppLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
  showHeader?: boolean
}

export function AppLayout({
  children,
  title,
  subtitle,
  showHeader = true,
}: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {showHeader && <Header title={title} subtitle={subtitle} />}
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </main>
    </div>
  )
}
