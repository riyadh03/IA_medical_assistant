'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/shared/card'
import { Button } from '@/components/ui/button'
import { ProgressTimeline } from '@/components/shared/progress-timeline'
import { StatusBadge } from '@/components/shared/status-badge'
import { FileText, Download, Home, Copy, CheckCircle2, Plus } from 'lucide-react'
import { generateConsultationPDF, type ConsultationReportData } from '@/lib/pdf-generator'

export default function FinalReportPage() {
  const router = useRouter()
  const [workflowId, setWorkflowId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [consultation, setConsultation] = useState<any>(null)
  const [questionAnswers, setQuestionAnswers] = useState<any[]>([])
  const [diagnosticSummary, setDiagnosticSummary] = useState('')
  const [interimCare, setInterimCare] = useState('')
  const [physicianReview, setPhysicianReview] = useState('')
  const [finalReport, setFinalReport] = useState('')
  const [copied, setCopied] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  useEffect(() => {
    const wId = localStorage.getItem('currentWorkflowId')
    if (!wId) {
      router.push('/consultation/create')
      return
    }
    setWorkflowId(wId)

    async function loadReport() {
      try {
        const res = await fetch(`http://localhost:8080/consultation/${wId}`)
        if (!res.ok) {
          throw new Error("Failed to load report data")
        }
        const data = await res.json()
        
        if (data.status !== 'completed' && !data.final_report) {
          if (data.status === 'waiting_physician') {
            router.push('/consultation/clinical-summary')
            return
          } else {
            router.push('/consultation/interview')
            return
          }
        }

        setConsultation({
          patientName: data.patient_name,
          age: String(data.patient_age),
          gender: data.patient_gender,
          chiefComplaint: data.chief_complaint
        })
        setQuestionAnswers(data.question_answers || [])
        setDiagnosticSummary(data.diagnostic_summary || '')
        setInterimCare(data.interim_care || '')
        setPhysicianReview(data.physician_review || '')
        setFinalReport(data.final_report || '')
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    loadReport()
  }, [router])

  const workflowSteps = [
    { id: '1', label: 'Patient Information', completed: true },
    { id: '2', label: 'Patient Interview', completed: true },
    { id: '3', label: 'Clinical Summary', completed: true },
    { id: '4', label: 'Physician Review', completed: true },
    { id: '5', label: 'Final Report', completed: true, current: true },
  ]

  const handleDownloadPDF = async () => {
    if (!consultation) return

    setIsGeneratingPDF(true)
    try {
      const reportData: ConsultationReportData = {
        patientName: consultation.patientName,
        age: consultation.age,
        gender: consultation.gender === 'M' || consultation.gender === 'Masculin' ? 'Male' : consultation.gender === 'F' || consultation.gender === 'Féminin' ? 'Female' : 'Other',
        chiefComplaint: consultation.chiefComplaint,
        consultationDate: new Date().toLocaleDateString(),
        questions: questionAnswers.map((qa, idx) => ({
          question: qa.question || `Question ${idx + 1}`,
          answer: qa.answer || 'N/A'
        })),
        clinicalSummary: diagnosticSummary,
        aiRecommendation: interimCare,
        physicianReview: physicianReview || 'Physician review completed.',
        finalStatus: 'Completed',
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
    if (!finalReport) return
    navigator.clipboard.writeText(finalReport)
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
                    {consultation?.gender === 'M' || consultation?.gender === 'Masculin' ? 'Male' : consultation?.gender === 'F' || consultation?.gender === 'Féminin' ? 'Female' : 'Other'}
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
                  <p className="font-semibold text-foreground mb-3">Questions Answered: 5 of 5</p>
                  {questionAnswers && (
                    <div className="space-y-3 text-muted-foreground">
                      {questionAnswers.map((qa, idx) => (
                        <div key={idx} className="flex flex-col gap-1 border-b border-border pb-2 last:border-0 last:pb-0">
                          <span className="font-medium text-primary text-xs">Q{idx + 1}: {qa.question}</span>
                          <span className="text-foreground pl-3 text-sm">R : {qa.answer}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Clinical Summary */}
            <Card title="Clinical Summary">
              <div className="whitespace-pre-line text-sm text-foreground leading-relaxed bg-muted/30 p-4 rounded-lg">
                {diagnosticSummary}
              </div>
            </Card>

            {/* Interim Recommendation */}
            <Card title="Interim Recommendation">
              <div className="whitespace-pre-line text-sm text-foreground leading-relaxed bg-muted/30 p-4 rounded-lg">
                {interimCare}
              </div>
            </Card>

            {/* Physician Review */}
            <Card title="Physician Review & Final Recommendations">
              <div className="bg-muted/30 p-4 rounded-lg whitespace-pre-line">
                <p className="text-sm text-foreground leading-relaxed">
                  {physicianReview || 'Physician review pending.'}
                </p>
              </div>
            </Card>

            {/* Structured Final Report */}
            <Card title="Rapport Final Complet Structuré" subtitle="Rapport Généré par l'Agent">
              <div className="bg-primary/5 border border-primary/20 p-5 rounded-lg whitespace-pre-line text-sm text-foreground leading-relaxed font-mono">
                {finalReport}
              </div>
            </Card>

            {/* Legal Disclaimer */}
            <Card className="border-accent/30 bg-accent/5">
              <div>
                <p className="font-semibold text-sm text-accent mb-2">Important Disclaimer</p>
                <p className="text-xs text-foreground leading-relaxed">
                  Ce système est un exercice académique et ne doit pas être présenté comme un dispositif médical ni fournir de diagnostic définitif. Ce système ne remplace pas une consultation médicale.
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
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
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
                  className="w-full flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy Final Report'}
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
                localStorage.removeItem('currentWorkflowId')
                localStorage.removeItem('currentConsultation')
                localStorage.removeItem('physicianReview')
                router.push('/consultation/create')
              }}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Start New Consultation
            </Button>

            {/* Back to Dashboard */}
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 cursor-pointer"
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
