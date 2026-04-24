import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import type { OrderPlanningStepId, SubmissionState } from '@/hooks/orders/planning/orderPlanningFlowTypes'

type OrderPlanningFormFooterProps = {
  submissionState: SubmissionState
  flowErrors: string[]
  activeStepIndex: number
  activeStepId: OrderPlanningStepId
  canSubmit: boolean
  isPending: boolean
  onPrev: () => void
  onNext: () => void
}

export function OrderPlanningFormFooter({
  submissionState,
  flowErrors,
  activeStepIndex,
  activeStepId,
  canSubmit,
  isPending,
  onPrev,
  onNext,
}: OrderPlanningFormFooterProps) {
  return (
    <div className="space-y-3">
      {flowErrors.length > 0 && <ErrorMessage message={flowErrors.join(' ')} />}

      {submissionState === 'partial_validation' && (
        <p className="text-sm text-amber-700">
          Partial validation failed. Fix highlighted fields and continue.
        </p>
      )}
      {submissionState === 'retry' && (
        <p className="text-sm text-amber-700">
          Submission failed. You can update data and retry.
        </p>
      )}
      {submissionState === 'loading' && (
        <p className="text-sm text-gray-600">Saving workflow...</p>
      )}

      <div className="flex justify-between gap-3">
        <div>
          {activeStepIndex > 0 && (
            <Button type="button" variant="secondary" onClick={onPrev}>
              Back
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          {activeStepId !== 'summary' && (
            <Button type="button" variant="secondary" onClick={onNext}>
              Next step
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            disabled={!canSubmit}
            className="min-w-[10rem]"
          >
            {isPending ? 'Saving…' : 'Create planned order'}
          </Button>
        </div>
      </div>
    </div>
  )
}
