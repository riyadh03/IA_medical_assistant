import { Check } from 'lucide-react'

interface TimelineStep {
  id: string
  label: string
  completed: boolean
  current?: boolean
}

interface ProgressTimelineProps {
  steps: TimelineStep[]
  orientation?: 'horizontal' | 'vertical'
}

export function ProgressTimeline({
  steps,
  orientation = 'horizontal',
}: ProgressTimelineProps) {
  if (orientation === 'vertical') {
    return (
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                  step.completed
                    ? 'bg-green-500 text-white'
                    : step.current
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {step.completed ? <Check className="w-5 h-5" /> : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className="w-0.5 h-8 bg-border mt-2" />
              )}
            </div>
            <div className="flex-1 pt-2">
              <p
                className={`font-medium text-sm ${
                  step.completed || step.current
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center flex-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs ${
              step.completed
                ? 'bg-green-500 text-white'
                : step.current
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {step.completed ? <Check className="w-4 h-4" /> : index + 1}
          </div>
          {index < steps.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-2 ${
                steps[index + 1].completed ? 'bg-green-500' : 'bg-border'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}
