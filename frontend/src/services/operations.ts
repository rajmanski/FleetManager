import api from '@/services/api'
import type {
  PlanOrderWorkflowRequestDTO,
  PlanOrderWorkflowResponseDTO,
} from '@/types/operations'

export async function planOrderWorkflow(
  payload: PlanOrderWorkflowRequestDTO,
): Promise<PlanOrderWorkflowResponseDTO> {
  const res = await api.post<PlanOrderWorkflowResponseDTO>(
    '/api/v1/operations/orders/plan',
    payload,
  )
  return res.data
}
