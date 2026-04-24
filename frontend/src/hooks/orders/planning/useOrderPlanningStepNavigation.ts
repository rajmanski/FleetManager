import { useCallback } from 'react'
import type { UseFormTrigger } from 'react-hook-form'
import type { OrderPlanningFormValues } from '@/schemas/orderPlanning'
import { STEP_FIELDS, type OrderPlanningStepId } from './orderPlanningFlowTypes'
import type { FlowAction } from './orderPlanningFlowReducer'

type Args = {
  steps: Array<{ id: OrderPlanningStepId }>
  activeStepIndex: number
  criticalIssuesCount: number
  trigger: UseFormTrigger<OrderPlanningFormValues>
  dispatch: (action: FlowAction) => void
}

export function useOrderPlanningStepNavigation({
  steps,
  activeStepIndex,
  criticalIssuesCount,
  trigger,
  dispatch,
}: Args) {
  const activeStep = steps[activeStepIndex] ?? steps[0]

  const goToStep = useCallback(
    (index: number) => {
      if (index < 0 || index >= steps.length) return
      dispatch({ type: 'GO_TO_STEP', index })
    },
    [dispatch, steps.length],
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
      dispatch({ type: 'STEP_VALIDATION_FAILED' })
      return false
    }

    dispatch({ type: 'GO_TO_STEP', index: activeStepIndex + 1 })
    return true
  }, [activeStepIndex, criticalIssuesCount, dispatch, steps, trigger])

  const prevStep = useCallback(() => {
    dispatch({ type: 'GO_TO_STEP', index: activeStepIndex - 1 })
  }, [activeStepIndex, dispatch])

  return { activeStep, goToStep, nextStep, prevStep }
}
