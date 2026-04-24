import { Button } from '@/components/ui/Button'
import type { OrderPlanningStepId, SectionErrors } from '@/hooks/orders/planning/orderPlanningFlowTypes'

type Step = { id: OrderPlanningStepId; title: string }

type OrderPlanningStepBarProps = {
  steps: Step[]
  activeStepId: OrderPlanningStepId
  backendSectionErrors: SectionErrors
  onGoToStep: (index: number) => void
}

export function OrderPlanningStepBar({
  steps,
  activeStepId,
  backendSectionErrors,
  onGoToStep,
}: OrderPlanningStepBarProps) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {steps.map((step, index) => {
        const isActive = step.id === activeStepId
        const hasBackendIssues = backendSectionErrors[step.id].length > 0
        return (
          <Button
            key={step.id}
            type="button"
            variant={isActive ? 'primary' : 'secondary'}
            className="px-3 py-1.5"
            onClick={() => onGoToStep(index)}
          >
            {index + 1}. {step.title}
            {hasBackendIssues ? ' *' : ''}
          </Button>
        )
      })}
    </div>
  )
}
