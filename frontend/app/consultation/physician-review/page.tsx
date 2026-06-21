'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/shared/card'
import { Button } from '@/components/ui/button'
import { ProgressTimeline } from '@/components/shared/progress-timeline'
import { StatusBadge } from '@/components/shared/status-badge'
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'

export default function PhysicianReviewPage() {
  const router = useRouter()
  const [workflowId, setWorkflowId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [consultation, setConsultation] = useState<any>(null)
  const [diagnosticSummary, setDiagnosticSummary] = useState('')
  const [interimCare, setInterimCare] = useState('')
  const [review, setReview] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const wId = localStorage.getItem('currentWorkflowId')
    if (!wId) {
      router.push('/consultation/create')
      return
    }
    setWorkflowId(wId)

    async function loadData() {
      try {
        const res = await fetch(`http://localhost:8080/consultation/${wId}`)
        if (!res.ok) {
          throw new Error("Failed to load status")
        }
        const data = await res.json()
        
        if (data.status === 'completed') {
          router.push('/consultation/final-report')
          return
        }
        if (data.status === 'waiting_patient') {
          router.push('/consultation/interview')
          return
        }

        setConsultation({
          patientName: data.patient_name,
          age: String(data.patient_age),
          gender: data.patient_gender,
          chiefComplaint: data.chief_complaint
        })
        setDiagnosticSummary(data.diagnostic_summary || '')
        setInterimCare(data.interim_care || '')
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [router])

  const workflowSteps = [
    { id: '1', label: 'Patient Information', completed: true },
    { id: '2', label: 'Patient Interview', completed: true },
    { id: '3', label: 'Clinical Summary', completed: true },
    { id: '4', label: 'Physician Review', completed: false, current: true },
    { id: '5', label: 'Final Report', completed: false },
  ]

  const handleSubmit = async (approved: boolean) => {
    if (!review.trim()) {
      setErrors({ review: 'Physician review is required' })
      return
    }
    setIsSubmitting(true)
    setErrors({})
    try {
      const res = await fetch(`http://localhost:8080/consultation/${workflowId}/physician-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ physician_review: review })
      })
      if (!res.ok) {
        throw new Error("Failed to submit physician review")
      }
      const data = await res.json()
      
      localStorage.setItem('physicianReview', JSON.stringify({ approved, review, timestamp: new Date() }))
      router.push('/consultation/final-report')
    } catch (err) {
      console.error(err)
      setErrors({ submit: "Failed to submit review to server. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppLayout title="Physician Review">
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
            <p className="text-muted-foreground">Loading patient data...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Review Section */}
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
                  <p className="text-xs font-medium text-muted-foreground mb-1">Chief Complaint</p>
                  <p className="text-xs font-semibold text-foreground line-clamp-2">
                    {consultation?.chiefComplaint}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
                  <StatusBadge status="review">Under Review</StatusBadge>
                </div>
              </div>
            </Card>

            {/* AI Clinical Summary (Read-only) */}
            <Card title="AI Clinical Summary" subtitle="For Reference">
              <div className="bg-muted/30 p-4 rounded-lg whitespace-pre-line">
                <p className="text-sm text-foreground leading-relaxed">{diagnosticSummary}</p>
              </div>
            </Card>

            {/* AI Interim Recommendation (Read-only) */}
            <Card title="Interim Recommendation" subtitle="For Reference">
              <div className="bg-muted/30 p-4 rounded-lg whitespace-pre-line text-sm text-foreground leading-relaxed">
                {interimCare}
              </div>
            </Card>

            {/* Physician Review Input */}
            <Card title="Physician Review" subtitle="Add your clinical assessment and recommendations">
              <div className="space-y-4">
                {errors.submit && (
                  <div className="p-3 rounded bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
                    {errors.submit}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Clinical Assessment & Recommendations *
                  </label>
                  <textarea
                    value={review}
                    onChange={(e) => {
                      setReview(e.target.value)
                      if (errors.review) setErrors({})
                    }}
                    rows={6}
                    className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                      errors.review
                        ? 'border-destructive bg-destructive/5'
                        : 'border-border bg-input'
                    } text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none`}
                    placeholder="Enter your professional clinical review, including any modifications to the AI summary, additional findings, and approved care recommendations..."
                  />
                  {errors.review && (
                    <p className="text-xs text-destructive mt-1">{errors.review}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleSubmit(false)}
                    disabled={isSubmitting}
                    variant="outline"
                    className="flex-1 cursor-pointer"
                  >
                    Request Modifications
                  </Button>
                  <Button
                    onClick={() => handleSubmit(true)}
                    disabled={isSubmitting || !review.trim()}
                    className="flex-1 bg-green-600 text-white hover:bg-green-700 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? 'Processing...' : 'Approve & Generate Report'}
                    <CheckCircle2 className="w-4 h-4" />
                  </Button>
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

            {/* Alert */}
            <Card className="border-accent/30 bg-accent/5">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-foreground mb-1">Workstation Mode</p>
                  <p className="text-xs text-muted-foreground">
                    This interface simulates a medical review workstation. Your inputs represent physician-level clinical judgment.
                  </p>
                </div>
              </div>
            </Card>

            {/* Information Box */}
            <Card title="Review Guidelines">
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Validate AI-generated summary</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Add clinical expertise</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Approve or request modifications</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
