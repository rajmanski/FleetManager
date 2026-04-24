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
  findFirstStepWithErrors,
  mapWorkflowErrorsToSections,
} from './orderPlanningFlowErrors'
import { EMPTY_SECTION_ERRORS, type OrderPlanningStepId } from './orderPlanningFlowTypes'
import type { FlowAction } from './orderPlanningFlowReducer'
import type { CalculateResult } from '@/services/routes'

type Args = {
  origin: AddressState
  destination: AddressState
  waypoints: WaypointState[]
  result: CalculateResult | null
  steps: Array<{ id: OrderPlanningStepId }>
  setError: UseFormSetError<OrderPlanningFormValues>
  dispatch: (action: FlowAction) => void
}

export function useOrderPlanningSubmission({
  origin,
  destination,
  waypoints,
  result,
  steps,
  setError,
  dispatch,
}: Args) {
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: planOrderWorkflow,
    onSuccess: (data) => {
      dispatch({ type: 'SUBMIT_SUCCESS' })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Planned order created successfully.')
      navigate(`/orders/${data.order.id}`)
    },
  })

  const onValidSubmit = useCallback(
    async (values: OrderPlanningFormValues) => {
      dispatch({ type: 'SUBMIT_START' })

      const built = await buildPlanOrderWorkflowRequestDTO(
        values,
        origin,
        destination,
        waypoints,
        result,
      )

      if (!built.ok) {
        dispatch({ type: 'BUILD_FAILED', routeError: built.error.message })
        return
      }

      mutation.mutate(built.payload, {
        onError: (err) => {
          const parsed = parseWorkflowValidationError(err)
          const backendErrors = parsed
            ? mapWorkflowErrorsToSections(parsed, steps)
            : EMPTY_SECTION_ERRORS
          const stepIndex = findFirstStepWithErrors(backendErrors, steps)
          const routeError = applyWorkflowApiErrors(err, setError)
          dispatch({ type: 'BACKEND_FAILED', backendErrors, routeError, stepIndex })
        },
      })
    },
    [destination, dispatch, mutation, origin, result, setError, steps, waypoints],
  )

  return { mutation, onValidSubmit }
}
