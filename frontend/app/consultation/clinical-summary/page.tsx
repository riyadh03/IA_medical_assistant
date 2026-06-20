'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/shared/card'
import { Button } from '@/components/ui/button'
import { ProgressTimeline } from '@/components/shared/progress-timeline'
import { StatusBadge } from '@/components/shared/status-badge'
import { ArrowRight, AlertCircle, Stethoscope } from 'lucide-react'

export default function ClinicalSummaryPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [consultation, setConsultation] = useState<any>(null)

  useEffect(() => {
    // Load consultation data
    const saved = localStorage.getItem('currentConsultation')
    if (!saved) {
      router.push('/consultation/create')
    } else {
      setConsultation(JSON.parse(saved))
      setIsLoading(false)
    }
  }, [router])

  const workflowSteps = [
    { id: '1', label: 'Patient Information', completed: true },
    { id: '2', label: 'Patient Interview', completed: true },
    { id: '3', label: 'Clinical Summary', completed: false, current: true },
    { id: '4', label: 'Physician Review', completed: false },
    { id: '5', label: 'Final Report', completed: false },
  ]

  const mockClinicalsummary = `Based on the patient interview and chief complaint of "${consultation?.chiefComplaint || 'condition'}", the following assessment has been generated:

Patient presents with symptoms requiring evaluation. Physical examination findings and patient-reported symptoms suggest potential considerations. The temporal pattern indicates acute onset requiring timely assessment.`

  const mockRecommendation = `1. Immediate actions: Monitor vital signs and ensure patient comfort
2. Diagnostic workup: Consider relevant investigations based on clinical presentation
3. Initial management: Supportive care and symptom management
4. Follow-up: Schedule physician review for comprehensive assessment and formal recommendations`

  return (
    <AppLayout title="Clinical Summary">
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
            <p className="text-muted-foreground">Generating clinical summary...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Patient Overview */}
            <Card title="Patient Overview">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Name</p>
                  <p className="text-sm font-semibold text-foreground">{consultation?.patientName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Age</p>
                  <p className="text-sm font-semibold text-foreground">{consultation?.age}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Gender</p>
                  <p className="text-sm font-semibold text-foreground">
                    {consultation?.gender === 'M' ? 'Male' : consultation?.gender === 'F' ? 'Female' : 'Other'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
                  <StatusBadge status="in-progress">Awaiting Review</StatusBadge>
                </div>
              </div>
            </Card>

            {/* Clinical Summary */}
            <Card title="Clinical Summary" subtitle="AI-Generated Assessment">
              <div className="space-y-4">
                <p className="text-sm text-foreground leading-relaxed">{mockClinicalsummary}</p>
              </div>
            </Card>

            {/* Interim Care Recommendation */}
            <Card title="Interim Care Recommendation" subtitle="Preliminary Guidance">
              <div className="space-y-3">
                {mockRecommendation.split('\n').map((line, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="text-primary font-bold text-sm min-w-fit">{idx + 1}.</div>
                    <p className="text-sm text-foreground">{line.replace(/^\d+\.\s/, '')}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Alert */}
            <Card className="border-accent/30 bg-accent/5">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-foreground mb-1">Waiting for Physician Review</p>
                  <p className="text-xs text-muted-foreground">
                    This summary requires physician review and approval before final report generation. A qualified healthcare provider will validate findings and provide clinical judgment.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Workflow Progress */}
            <Card title="Workflow Progress">
              <ProgressTimeline steps={workflowSteps} orientation="vertical" />
            </Card>

            {/* Chief Complaint Reference */}
            <Card title="Chief Complaint">
              <p className="text-sm text-foreground">{consultation?.chiefComplaint}</p>
            </Card>

            {/* Next Step CTA */}
            <Button
              onClick={() => router.push('/consultation/physician-review')}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2"
            >
              <Stethoscope className="w-4 h-4" />
              Proceed to Physician Review
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
