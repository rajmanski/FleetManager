import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'

export type Order = {
  id: number
  clientId: number
  orderNumber: string
  creationDate?: string
  deliveryDeadline?: string
  totalPricePln?: number
  status: string
  clientCompany?: string
}

type ListOrdersResponse = {
  data: Order[]
  page: number
  limit: number
  total: number
}

type UseOrdersParams = {
  page: number
  limit: number
  status: string
  search: string
}

export function useOrders({ page, limit, status, search }: UseOrdersParams) {
  const ordersQuery = useQuery({
    queryKey: ['orders', { status, search, page, limit }],
    queryFn: async () => {
      const res = await api.get<ListOrdersResponse>('/api/v1/orders', {
        params: {
          page,
          limit,
          status: status || undefined,
          q: search.trim() || undefined,
        },
      })
      return res.data
    },
  })

  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (payload: {
      clientId: number
      orderNumber: string
      deliveryDeadline?: string
      totalPricePln?: number
    }) => {
      const res = await api.post<Order>('/api/v1/orders', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })

  return {
    ordersQuery,
    createMutation,
  }
}
