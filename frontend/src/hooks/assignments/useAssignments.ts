import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import type { PaginatedResponse } from '@/types/common'

export type Assignment = {
  assignment_id: number
  vehicle_id: number
  driver_id: number
  assigned_from: string
  assigned_to?: string | null
  vehicle_vin?: string
  vehicle_brand?: string
  vehicle_model?: string
  driver_name?: string
}

export type ListAssignmentsResponse = PaginatedResponse<Assignment>

export type UseAssignmentsParams = {
  page: number
  limit: number
  activeOnly: boolean
}

export type CreateAssignmentPayload = {
  vehicle_id: number
  driver_id: number
  assigned_from: string
}

export function useAssignments({ page, limit, activeOnly }: UseAssignmentsParams) {
  const queryClient = useQueryClient()

  const assignmentsQuery = useQuery({
    queryKey: ['assignments', { page, limit, activeOnly }],
    queryFn: async () => {
      const res = await api.get<ListAssignmentsResponse>('/api/v1/assignments', {
        params: {
          page,
          limit,
          active: activeOnly ? 'true' : 'false',
        },
      })
      return res.data
    },
  })

  const createAssignmentMutation = useMutation({
    mutationFn: async (payload: CreateAssignmentPayload) => {
      const res = await api.post<Assignment>('/api/v1/assignments', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
    },
  })

  const endAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: number) => {
      const res = await api.put<Assignment>(`/api/v1/assignments/${assignmentId}/end`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
    },
  })

  return {
    assignmentsQuery,
    createAssignmentMutation,
    endAssignmentMutation,
  }
}

