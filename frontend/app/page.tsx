'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/shared/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Activity,
  ArrowRight,
  FileText,
  MessageSquare,
  Stethoscope,
} from 'lucide-react'

export default function HomePage() {
  const recentConsultations = [
    {
      id: 1,
      patientName: 'Jean Dupont',
      age: 45,
      chiefComplaint: 'Chest pain',
      status: 'completed',
      date: '2024-12-18',
    },
    {
      id: 2,
      patientName: 'Marie Martin',
      age: 32,
      chiefComplaint: 'Persistent headache',
      status: 'in-review',
      date: '2024-12-17',
    },
    {
      id: 3,
      patientName: 'Pierre Dupuis',
      age: 58,
      chiefComplaint: 'Shortness of breath',
      status: 'pending',
      date: '2024-12-16',
    },
  ]

  const stats = [
    { label: 'Total Consultations', value: '24', icon: Activity },
    { label: 'Completed', value: '18', icon: FileText },
    { label: 'Under Review', value: '4', icon: MessageSquare },
    { label: 'Success Rate', value: '95%', icon: Stethoscope },
  ]

  return (
    <AppLayout title="Dashboard" subtitle="Clinical Orientation System Overview">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label} className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </Card>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Link href="/consultation/create" className="flex-1">
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              Start New Consultation
            </Button>
          </Link>
        </div>

        {/* Recent Consultations */}
        <Card title="Recent Consultations">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs font-medium text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left py-3 px-3">Patient</th>
                  <th className="text-left py-3 px-3">Age</th>
                  <th className="text-left py-3 px-3">Chief Complaint</th>
                  <th className="text-left py-3 px-3">Status</th>
                  <th className="text-left py-3 px-3">Date</th>
                  <th className="text-left py-3 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentConsultations.map((consultation) => (
                  <tr key={consultation.id} className="hover:bg-muted/30">
                    <td className="py-3 px-3 font-medium text-foreground">
                      {consultation.patientName}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">
                      {consultation.age}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">
                      {consultation.chiefComplaint}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                          consultation.status === 'completed'
                            ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                            : consultation.status === 'in-review'
                              ? 'bg-accent/20 text-accent-foreground'
                              : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {consultation.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">
                      {consultation.date}
                    </td>
                    <td className="py-3 px-3">
                      <Link
                        href={`/consultation/${consultation.id}`}
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        View <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}

function Plus({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
  )
}
