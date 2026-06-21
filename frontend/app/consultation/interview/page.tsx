'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/shared/card'
import { Button } from '@/components/ui/button'
import { ProgressTimeline } from '@/components/shared/progress-timeline'
import { CheckCircle2, AlertCircle } from 'lucide-react'

const QUESTION_LABELS = [
  "Durée des symptômes",
  "Fièvre & Température",
  "Toux & Maux de gorge",
  "Difficultés respiratoires",
  "Traitements en cours"
]

export default function InterviewPage() {
  const router = useRouter()
  const [workflowId, setWorkflowId] = useState<string | null>(null)
  const [consultation, setConsultation] = useState<any>(null)
  
  const [currentQuestion, setCurrentQuestion] = useState<string>('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0)
  const [questionAnswers, setQuestionAnswers] = useState<any[]>([])
  
  const [answerText, setAnswerText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const wId = localStorage.getItem('currentWorkflowId')
    const saved = localStorage.getItem('currentConsultation')
    if (!wId || !saved) {
      router.push('/consultation/create')
      return
    }
    setWorkflowId(wId)
    setConsultation(JSON.parse(saved))

    async function loadStatus() {
      try {
        const res = await fetch(`http://localhost:8080/consultation/${wId}`)
        if (!res.ok) {
          throw new Error("Failed to load active status")
        }
        const data = await res.json()
        
        if (data.status === 'completed') {
          router.push('/consultation/final-report')
          return
        }
        if (data.status === 'waiting_physician') {
          router.push('/consultation/clinical-summary')
          return
        }
        
        setCurrentQuestion(data.next_question || '')
        setCurrentQuestionIndex(data.current_question_index || 0)
        setQuestionAnswers(data.question_answers || [])
      } catch (err) {
        console.error(err)
        setError("Failed to communicate with the clinical backend. Please verify your backend service.")
      } finally {
        setIsLoading(false)
      }
    }
    loadStatus()
  }, [router])

  const workflowSteps = [
    { id: '1', label: 'Patient Information', completed: true },
    { id: '2', label: 'Patient Interview', completed: false, current: true },
    { id: '3', label: 'Clinical Summary', completed: false },
    { id: '4', label: 'Physician Review', completed: false },
    { id: '5', label: 'Final Report', completed: false },
  ]

  const handleSubmitAnswer = async () => {
    if (!answerText.trim() || !workflowId) return
    setIsSubmitting(true)
    setError('')
    try {
      const res = await fetch(`http://localhost:8080/consultation/${workflowId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: answerText })
      })
      if (!res.ok) {
        throw new Error("Failed to submit answer")
      }
      const data = await res.json()
      
      if (data.status === 'waiting_physician') {
        router.push('/consultation/clinical-summary')
      } else {
        setAnswerText('')
        // Retrieve updated question answers list and question index
        const statusRes = await fetch(`http://localhost:8080/consultation/${workflowId}`)
        if (statusRes.ok) {
          const statusData = await statusRes.json()
          setCurrentQuestion(statusData.next_question || '')
          setCurrentQuestionIndex(statusData.current_question_index || 0)
          setQuestionAnswers(statusData.question_answers || [])
        }
      }
    } catch (err) {
      console.error(err)
      setError("Failed to register answer on server. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppLayout title="Patient Interview">
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
            <p className="text-muted-foreground">Loading patient interview...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Interview Section */}
          <div className="lg:col-span-2 space-y-4">
            <Card title={`Question ${currentQuestionIndex + 1} of 5`}>
              <div className="space-y-6">
                {/* Progress Bar */}
                <div className="bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / 5) * 100}%` }}
                  />
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3 rounded bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 flex gap-2 items-center">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Question */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    {currentQuestion || "Chargement de la question..."}
                  </h3>

                  {/* Answer Input */}
                  <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Saisissez votre réponse ici..."
                  />
                </div>

                {/* Navigation */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={isSubmitting || !answerText.trim()}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? 'Envoi...' : currentQuestionIndex === 4 ? 'Finaliser l\'entretien' : 'Suivant'}
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

            {/* Answered Questions Summary */}
            <Card title="Answered Questions" subtitle={`${questionAnswers.length} of 5`}>
              <div className="space-y-3">
                {[0, 1, 2, 3, 4].map((idx) => {
                  const isAnswered = idx < questionAnswers.length
                  const isActive = idx === currentQuestionIndex
                  const answerObj = questionAnswers[idx]
                  
                  return (
                    <div
                      key={idx}
                      className={`flex items-start gap-2 p-2 rounded transition-colors ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : isAnswered
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-muted-foreground'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5 ${
                          isAnswered
                            ? 'bg-green-600 text-white'
                            : 'bg-border text-foreground'
                        }`}
                      >
                        {isAnswered ? '✓' : idx + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">Q{idx + 1}: {QUESTION_LABELS[idx]}</span>
                        {isAnswered && (
                          <span className="text-[10px] text-muted-foreground line-clamp-1 italic mt-0.5">
                            "{answerObj?.answer}"
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
