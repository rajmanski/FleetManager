import { useCallback, useState } from 'react'
import type { UseFormTrigger } from 'react-hook-form'
import { STEP_FIELDS, type OrderPlanningStepId, type SubmissionState } from './orderPlanningFlow.helpers'
import type { OrderPlanningFormValues } from '@/schemas/orderPlanning'

type Args = {
  steps: Array<{ id: OrderPlanningStepId }>
  criticalIssuesCount: number
  trigger: UseFormTrigger<OrderPlanningFormValues>
  setSubmissionState: (state: SubmissionState) => void
}

export function useOrderPlanningStepNavigation({
  steps,
  criticalIssuesCount,
  trigger,
  setSubmissionState,
}: Args) {
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const activeStep = steps[activeStepIndex] ?? steps[0]

  const goToStep = useCallback(
    (index: number) => {
      if (index < 0 || index >= steps.length) {
        return
      }
      setActiveStepIndex(index)
    },
    [steps.length],
  )

  const nextStep = useCallback(async () => {
    const current = steps[activeStepIndex]
    if (!current) return false
    if (current.id === 'summary') return true

    let valid = true
    if (current.id === 'route') {
      valid = criticalIssuesCount === 0
    } else {
      valid = await trigger(STEP_FIELDS[current.id], { shouldFocus: true })
    }
    if (!valid) {
      setSubmissionState('partial_validation')
      return false
    }
    goToStep(activeStepIndex + 1)
    return true
  }, [activeStepIndex, criticalIssuesCount, goToStep, setSubmissionState, steps, trigger])

  const prevStep = useCallback(() => {
    goToStep(activeStepIndex - 1)
  }, [activeStepIndex, goToStep])

  return {
    activeStepIndex,
    activeStep,
    setActiveStepIndex,
    goToStep,
    nextStep,
    prevStep,
  }
}

