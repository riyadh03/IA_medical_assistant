'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/shared/card'
import { Button } from '@/components/ui/button'
import { ProgressTimeline } from '@/components/shared/progress-timeline'
import { StatusBadge } from '@/components/shared/status-badge'
import { FileText, Download, Home, Copy, CheckCircle2 } from 'lucide-react'
import { generateConsultationPDF, type ConsultationReportData } from '@/lib/pdf-generator'

export default function FinalReportPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [consultation, setConsultation] = useState<any>(null)
  const [answers, setAnswers] = useState<any>(null)
  const [review, setReview] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('currentConsultation')
    if (!saved) {
      router.push('/consultation/create')
    } else {
      setConsultation(JSON.parse(saved))
      const savedAnswers = localStorage.getItem('consultationAnswers')
      if (savedAnswers) setAnswers(JSON.parse(savedAnswers))
      const savedReview = localStorage.getItem('physicianReview')
      if (savedReview) setReview(JSON.parse(savedReview))
      setIsLoading(false)
    }
  }, [router])

  const workflowSteps = [
    { id: '1', label: 'Patient Information', completed: true },
    { id: '2', label: 'Patient Interview', completed: true },
    { id: '3', label: 'Clinical Summary', completed: true },
    { id: '4', label: 'Physician Review', completed: true },
    { id: '5', label: 'Final Report', completed: true, current: true },
  ]

  const handleDownloadPDF = async () => {
    if (!consultation || !answers) return

    setIsGeneratingPDF(true)
    try {
      const reportData: ConsultationReportData = {
        patientName: consultation.patientName,
        age: consultation.age,
        gender: consultation.gender === 'M' ? 'Male' : consultation.gender === 'F' ? 'Female' : 'Other',
        chiefComplaint: consultation.chiefComplaint,
        consultationDate: new Date().toLocaleDateString(),
        questions: [
          { question: 'Symptom Duration', answer: String(answers.q1 || 'N/A') },
          { question: 'Symptom Severity (1-10)', answer: String(answers.q2 || 'N/A') },
          { question: 'Symptom Frequency', answer: String(answers.q3 || 'N/A') },
          { question: 'Current Medications', answer: String(answers.q4 || 'N/A') },
          { question: 'Medical History & Allergies', answer: String(answers.q5 || 'N/A') },
        ],
        clinicalSummary:
          'Based on the comprehensive patient interview, a thorough clinical assessment has been completed. The patient presented with relevant symptoms requiring professional medical evaluation. All interview data has been documented and analyzed.',
        aiRecommendation:
          'Initial assessment recommends immediate physician consultation for symptom validation, appropriate diagnostic testing as needed, and clinical management planning. Patient requires professional medical evaluation and ongoing monitoring.',
        physicianReview:
          review?.review ||
          'Physician review and validation of clinical assessment. All recommendations require physician approval before implementation.',
        finalStatus: 'Consultation Completed - Ready for Physician Review',
      }

      const fileName = `clinical-report-${consultation.patientName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`
      await generateConsultationPDF(reportData, fileName)
    } catch (error) {
      console.error('[v0] PDF generation failed:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleCopyReport = () => {
    const reportText = `
CLINICAL ORIENTATION SYSTEM - FINAL REPORT

Patient Information:
- Name: ${consultation?.patientName}
- Age: ${consultation?.age}
- Chief Complaint: ${consultation?.chiefComplaint}

Interview Responses:
${answers ? Object.entries(answers).map(([k, v]) => `Q${k}: ${v}`).join('\n') : 'N/A'}

Physician Review:
${review?.review || 'Pending'}

Generated: ${new Date().toLocaleString()}
    `.trim()
    navigator.clipboard.writeText(reportText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AppLayout title="Final Report">
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
            <p className="text-muted-foreground">Generating final report...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Report */}
          <div className="lg:col-span-2 space-y-4">
            {/* Success Badge */}
            <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-semibold text-sm text-foreground">Report Completed</p>
                <p className="text-xs text-muted-foreground">All workflow steps have been completed</p>
              </div>
            </div>

            {/* Patient Information */}
            <Card title="Patient Information">
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
                  <StatusBadge status="completed">Completed</StatusBadge>
                </div>
              </div>
            </Card>

            {/* Interview Summary */}
            <Card title="Patient Interview Summary">
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-foreground mb-2">Questions Answered: 5 of 5</p>
                  {answers && (
                    <div className="space-y-2 text-muted-foreground">
                      {Object.entries(answers).map(([k, v], idx) => (
                        <div key={k} className="flex gap-3">
                          <span className="font-medium text-primary">Q{idx + 1}:</span>
                          <span>{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Clinical Summary */}
            <Card title="Clinical Summary">
              <p className="text-sm text-foreground leading-relaxed">
                Based on the patient interview and clinical presentation, a comprehensive assessment has been generated. The AI-generated summary identified key clinical features requiring physician validation.
              </p>
            </Card>

            {/* Interim Recommendation */}
            <Card title="Interim Recommendation">
              <p className="text-sm text-foreground leading-relaxed">
                Initial assessment recommends supportive care, monitoring, and timely physician evaluation for appropriate management and follow-up.
              </p>
            </Card>

            {/* Physician Review */}
            <Card title="Physician Review & Final Recommendations">
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm text-foreground leading-relaxed">
                  {review?.review ||
                    'Physician review pending. This section will contain the physician\'s clinical assessment and approved recommendations.'}
                </p>
              </div>
            </Card>

            {/* Legal Disclaimer */}
            <Card className="border-accent/30 bg-accent/5">
              <div>
                <p className="font-semibold text-sm text-accent mb-2">Important Disclaimer</p>
                <p className="text-xs text-foreground leading-relaxed">
                  This system is an educational tool demonstrating multi-agent clinical workflow simulation. It does not provide actual medical diagnosis or treatment recommendations. All clinical decisions must be made by qualified healthcare professionals with appropriate medical training and licensing. Patients should always consult with licensed physicians for medical advice, diagnosis, and treatment.
                </p>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Workflow Progress */}
            <Card title="Workflow Progress">
              <ProgressTimeline steps={workflowSteps} orientation="vertical" />
            </Card>

            {/* Report Actions */}
            <Card title="Report Actions">
              <div className="space-y-2">
                <Button
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGeneratingPDF ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download PDF
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCopyReport}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy Text'}
                </Button>
              </div>
            </Card>

            {/* Next Steps */}
            <Card title="Consultation Summary">
              <div className="space-y-3 text-xs">
                <div>
                  <p className="font-medium text-foreground mb-1">Timeline</p>
                  <p className="text-muted-foreground">
                    {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">Report Status</p>
                  <p className="text-green-600 dark:text-green-400 font-medium">Completed</p>
                </div>
              </div>
            </Card>

            {/* Start New Consultation */}
            <Button
              onClick={() => {
                localStorage.removeItem('currentConsultation')
                localStorage.removeItem('consultationAnswers')
                localStorage.removeItem('physicianReview')
                router.push('/consultation/create')
              }}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Start New Consultation
            </Button>

            {/* Back to Dashboard */}
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      )}
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
