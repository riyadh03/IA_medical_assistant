'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/shared/card'
import { Button } from '@/components/ui/button'
import { ProgressTimeline } from '@/components/shared/progress-timeline'
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'

interface Question {
  id: number
  text: string
  type: 'text' | 'radio' | 'textarea'
  options?: string[]
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: 'How long have you been experiencing this complaint?',
    type: 'radio',
    options: ['Less than 24 hours', '1-7 days', '1-4 weeks', 'More than a month'],
  },
  {
    id: 2,
    text: 'On a scale of 1-10, how severe is your current symptom?',
    type: 'radio',
    options: ['1-2 (Mild)', '3-5 (Moderate)', '6-8 (Severe)', '9-10 (Very Severe)'],
  },
  {
    id: 3,
    text: 'Have you experienced this symptom before?',
    type: 'radio',
    options: ['First time', 'Occasionally', 'Frequently', 'Chronically'],
  },
  {
    id: 4,
    text: 'Are you currently taking any medications?',
    type: 'text',
  },
  {
    id: 5,
    text: 'Do you have any known allergies or past medical conditions we should consider?',
    type: 'textarea',
  },
]

export default function InterviewPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Load saved consultation data if available
    const saved = localStorage.getItem('currentConsultation')
    if (!saved) {
      router.push('/consultation/create')
    }
  }, [router])

  const workflowSteps = [
    { id: '1', label: 'Patient Information', completed: true },
    { id: '2', label: 'Patient Interview', completed: false, current: true },
    { id: '3', label: 'Clinical Summary', completed: false },
    { id: '4', label: 'Physician Review', completed: false },
    { id: '5', label: 'Final Report', completed: false },
  ]

  const currentQuestion = QUESTIONS[currentStep]
  const isFirstQuestion = currentStep === 0
  const isLastQuestion = currentStep === QUESTIONS.length - 1
  const allAnswered = Object.keys(answers).length === QUESTIONS.length

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }))
  }

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    // Save answers
    localStorage.setItem('consultationAnswers', JSON.stringify(answers))
    router.push('/consultation/clinical-summary')
  }

  return (
    <AppLayout title="Patient Interview">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Interview Section */}
        <div className="lg:col-span-2">
          <Card title={`Question ${currentStep + 1} of ${QUESTIONS.length}`}>
            <div className="space-y-6">
              {/* Progress Bar */}
              <div className="bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }}
                />
              </div>

              {/* Question */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  {currentQuestion.text}
                </h3>

                {/* Answer Input */}
                {currentQuestion.type === 'radio' && (
                  <div className="space-y-2">
                    {currentQuestion.options?.map((option) => (
                      <label
                        key={option}
                        className="flex items-center p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          value={option}
                          checked={answers[currentQuestion.id] === option}
                          onChange={(e) => handleAnswer(e.target.value)}
                          className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary"
                        />
                        <span className="ml-3 text-foreground">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'text' && (
                  <input
                    type="text"
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswer(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter your answer"
                  />
                )}

                {currentQuestion.type === 'textarea' && (
                  <textarea
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswer(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Enter your answer"
                  />
                )}
              </div>

              {/* Navigation */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handlePrevious}
                  disabled={isFirstQuestion}
                  variant="outline"
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </Button>

                {!isLastQuestion ? (
                  <Button
                    onClick={handleNext}
                    disabled={!answers[currentQuestion.id]}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleComplete}
                    disabled={isSubmitting || !answers[currentQuestion.id]}
                    className="flex-1 bg-green-600 text-white hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? 'Processing...' : 'Complete Interview'}
                    <CheckCircle2 className="w-4 h-4" />
                  </Button>
                )}
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
          <Card title="Answered Questions" subtitle={`${Object.keys(answers).length} of ${QUESTIONS.length}`}>
            <div className="space-y-2">
              {QUESTIONS.map((q, idx) => (
                <div
                  key={q.id}
                  className={`flex items-center gap-2 p-2 rounded transition-colors cursor-pointer ${
                    idx === currentStep
                      ? 'bg-primary/10 text-primary'
                      : answers[q.id]
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-muted-foreground'
                  }`}
                  onClick={() => setCurrentStep(idx)}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                      answers[q.id]
                        ? 'bg-green-600 text-white'
                        : 'bg-border text-foreground'
                    }`}
                  >
                    {answers[q.id] ? '✓' : idx + 1}
                  </div>
                  <span className="text-xs font-medium">Q{idx + 1}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
