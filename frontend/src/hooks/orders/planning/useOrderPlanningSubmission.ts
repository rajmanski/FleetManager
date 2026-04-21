import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import type { UseFormSetError } from 'react-hook-form'
import { useToast } from '@/context/ToastContext'
import { planOrderWorkflow } from '@/services/operations'
import { buildPlanOrderWorkflowRequestDTO } from '@/utils/orderPlanning'
import {
  applyWorkflowApiErrors,
  parseWorkflowValidationError,
} from '@/utils/orderPlanningWorkflowErrors'
import type { AddressState, WaypointState } from '@/types/routes'
import type { OrderPlanningFormValues } from '@/schemas/orderPlanning'
import {
  EMPTY_SECTION_ERRORS,
  findFirstStepWithErrors,
  mapWorkflowErrorsToSections,
  type OrderPlanningStepId,
  type SectionErrors,
  type SubmissionState,
} from './orderPlanningFlow.helpers'
import type { CalculateResult } from '@/services/routes'

type Args = {
  origin: AddressState
  destination: AddressState
  waypoints: WaypointState[]
  result: CalculateResult | null
  steps: Array<{ id: OrderPlanningStepId }>
  setError: UseFormSetError<OrderPlanningFormValues>
  setRouteFlowError: (message: string | null) => void
  setBackendSectionErrors: (errors: SectionErrors) => void
  setSubmissionState: (state: SubmissionState) => void
  setLastErrorSource: (source: 'none' | 'backend' | 'local') => void
  setActiveStepIndex: (index: number) => void
}

export function useOrderPlanningSubmission({
  origin,
  destination,
  waypoints,
  result,
  steps,
  setError,
  setRouteFlowError,
  setBackendSectionErrors,
  setSubmissionState,
  setLastErrorSource,
  setActiveStepIndex,
}: Args) {
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: planOrderWorkflow,
    onSuccess: (data) => {
      setSubmissionState('idle')
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Planned order created successfully.')
      navigate(`/orders/${data.order.id}`)
    },
  })

  const onValidSubmit = useCallback(
    async (values: OrderPlanningFormValues) => {
      setRouteFlowError(null)
      setBackendSectionErrors(EMPTY_SECTION_ERRORS)
      setSubmissionState('loading')

      const built = await buildPlanOrderWorkflowRequestDTO(
        values,
        origin,
        destination,
        waypoints,
        result,
      )
      if (!built.ok) {
        setRouteFlowError(built.error.message)
        setSubmissionState('partial_validation')
        setActiveStepIndex(2)
        setLastErrorSource('local')
        return
      }

      mutation.mutate(built.payload, {
        onError: (err) => {
          const parsed = parseWorkflowValidationError(err)
          if (parsed) {
            const sectionErrors = mapWorkflowErrorsToSections(parsed, steps)
            setBackendSectionErrors(sectionErrors)

            const firstStepWithErrors = findFirstStepWithErrors(sectionErrors, steps)
            if (firstStepWithErrors >= 0) {
              setActiveStepIndex(firstStepWithErrors)
            }
          }

          const message = applyWorkflowApiErrors(err, setError)
          setRouteFlowError(message)
          setLastErrorSource('backend')
          setSubmissionState('retry')
        },
      })
    },
    [
      destination,
      mutation,
      origin,
      result,
      setActiveStepIndex,
      setBackendSectionErrors,
      setError,
      setLastErrorSource,
      setRouteFlowError,
      setSubmissionState,
      steps,
      waypoints,
    ],
  )

  return {
    mutation,
    onValidSubmit,
  }
}

