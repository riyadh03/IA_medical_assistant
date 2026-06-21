'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
  const [consultations, setConsultations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchConsultations() {
      try {
        const res = await fetch("http://localhost:8080/consultation")
        if (res.ok) {
          const data = await res.json()
          setConsultations(data)
        }
      } catch (err) {
        console.error("Failed to fetch consultations", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchConsultations()
  }, [])

  const stats = [
    { label: 'Total Consultations', value: String(consultations.length), icon: Activity },
    { label: 'Completed', value: String(consultations.filter(c => c.status === 'completed').length), icon: FileText },
    { label: 'Under Physician Review', value: String(consultations.filter(c => c.status === 'waiting_physician').length), icon: MessageSquare },
    { label: 'Awaiting Patient Answer', value: String(consultations.filter(c => c.status === 'waiting_patient' || c.status === 'running').length), icon: Stethoscope },
  ]

  const handleViewConsultation = (c: any) => {
    localStorage.setItem('currentWorkflowId', c.workflow_id)
    localStorage.setItem('currentConsultation', JSON.stringify({
      patientName: c.patient_name,
      age: String(c.patient_age),
      gender: c.patient_gender,
      chiefComplaint: c.chief_complaint
    }))
    
    // Redirect based on status
    if (c.status === 'completed') {
      router.push('/consultation/final-report')
    } else if (c.status === 'waiting_physician') {
      router.push('/consultation/clinical-summary')
    } else if (c.status === 'waiting_patient') {
      router.push('/consultation/interview')
    } else {
      router.push('/consultation/interview')
    }
  }

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
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 cursor-pointer">
              <Plus className="w-4 h-4" />
              Start New Consultation
            </Button>
          </Link>
        </div>

        {/* Recent Consultations */}
        <Card title="Recent Consultations">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : consultations.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">No consultations found. Start a new one to begin.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs font-medium text-muted-foreground border-b border-border">
                  <tr>
                    <th className="text-left py-3 px-3">Patient</th>
                    <th className="text-left py-3 px-3">Age</th>
                    <th className="text-left py-3 px-3">Chief Complaint</th>
                    <th className="text-left py-3 px-3">Status</th>
                    <th className="text-left py-3 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {consultations.map((consultation) => (
                    <tr key={consultation.workflow_id} className="hover:bg-muted/30">
                      <td className="py-3 px-3 font-medium text-foreground">
                        {consultation.patient_name}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">
                        {consultation.patient_age}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground max-w-xs truncate">
                        {consultation.chief_complaint}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                            consultation.status === 'completed'
                              ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                              : consultation.status === 'waiting_physician'
                                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                                : 'bg-blue-500/20 text-blue-700 dark:text-blue-400'
                          }`}
                        >
                          {consultation.status === 'completed' 
                            ? 'Completed' 
                            : consultation.status === 'waiting_physician' 
                              ? 'Awaiting Physician' 
                              : 'Awaiting Patient'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleViewConsultation(consultation)}
                          className="text-primary hover:underline flex items-center gap-1 font-medium cursor-pointer"
                        >
                          View <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
