'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card } from '@/components/shared/card'
import { Button } from '@/components/ui/button'
import { ProgressTimeline } from '@/components/shared/progress-timeline'
import { ArrowRight } from 'lucide-react'

interface ConsultationForm {
  patientName: string
  age: string
  gender: string
  chiefComplaint: string
}

export default function ConsultationCreatePage() {
  const router = useRouter()
  const [form, setForm] = useState<ConsultationForm>({
    patientName: '',
    age: '',
    gender: '',
    chiefComplaint: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const workflowSteps = [
    { id: '1', label: 'Patient Information', completed: true, current: true },
    { id: '2', label: 'Patient Interview', completed: false },
    { id: '3', label: 'Clinical Summary', completed: false },
    { id: '4', label: 'Physician Review', completed: false },
    { id: '5', label: 'Final Report', completed: false },
  ]

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!form.patientName.trim()) newErrors.patientName = 'Patient name is required'
    if (!form.age.trim()) newErrors.age = 'Age is required'
    if (!form.gender) newErrors.gender = 'Gender is required'
    if (!form.chiefComplaint.trim()) newErrors.chiefComplaint = 'Chief complaint is required'
    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch("http://localhost:8080/consultation/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_name: form.patientName,
          patient_age: parseInt(form.age),
          patient_gender: form.gender === 'M' ? 'Masculin' : form.gender === 'F' ? 'Féminin' : 'Autre',
          chief_complaint: form.chiefComplaint,
        })
      })
      if (!res.ok) {
        throw new Error("Failed to start consultation")
      }
      const data = await res.json()
      // Store current workflow ID and consultation details in localStorage
      localStorage.setItem('currentWorkflowId', data.workflow_id)
      localStorage.setItem('currentConsultation', JSON.stringify(form))
      router.push('/consultation/interview')
    } catch (err) {
      console.error(err)
      setErrors({ submit: "Failed to connect to the medical assistant service. Please check if the backend is running." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppLayout title="Start New Consultation">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card title="Patient Information" subtitle="Enter basic patient details to begin consultation">
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.submit && (
                <div className="p-3 rounded bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
                  {errors.submit}
                </div>
              )}
              {/* Patient Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Patient Name *
                </label>
                <input
                  type="text"
                  name="patientName"
                  value={form.patientName}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    errors.patientName
                      ? 'border-destructive bg-destructive/5'
                      : 'border-border bg-input'
                  } text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
                  placeholder="Enter patient's full name"
                />
                {errors.patientName && (
                  <p className="text-xs text-destructive mt-1">{errors.patientName}</p>
                )}
              </div>

              {/* Age and Gender */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Age *
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={form.age}
                    onChange={handleChange}
                    min="0"
                    max="150"
                    className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                      errors.age
                        ? 'border-destructive bg-destructive/5'
                        : 'border-border bg-input'
                    } text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
                    placeholder="Age in years"
                  />
                  {errors.age && (
                    <p className="text-xs text-destructive mt-1">{errors.age}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                      errors.gender
                        ? 'border-destructive bg-destructive/5'
                        : 'border-border bg-input'
                    } text-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
                  >
                    <option value="">Select gender</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="text-xs text-destructive mt-1">{errors.gender}</p>
                  )}
                </div>
              </div>

              {/* Chief Complaint */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Chief Complaint *
                </label>
                <textarea
                  name="chiefComplaint"
                  value={form.chiefComplaint}
                  onChange={handleChange}
                  rows={4}
                  className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                    errors.chiefComplaint
                      ? 'border-destructive bg-destructive/5'
                      : 'border-border bg-input'
                  } text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none`}
                  placeholder="Describe the patient's main complaint or reason for visit"
                />
                {errors.chiefComplaint && (
                  <p className="text-xs text-destructive mt-1">{errors.chiefComplaint}</p>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Processing...' : 'Start Consultation'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Workflow Progress Sidebar */}
        <div>
          <Card title="Workflow Progress">
            <ProgressTimeline steps={workflowSteps} orientation="vertical" />
          </Card>

          {/* Legal Notice */}
          <Card className="mt-4 bg-accent/5 border-accent/30 rounded-lg p-4">
            <p className="text-xs text-foreground leading-relaxed font-medium">
              <span className="block mb-2 font-semibold text-accent">Disclaimer</span>
              This system is an educational tool and does not replace professional medical
              consultation. Always consult qualified healthcare providers for medical advice.
            </p>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
