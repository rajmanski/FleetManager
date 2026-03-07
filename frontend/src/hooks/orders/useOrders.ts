import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import type { CargoPayload } from '@/schemas/cargo'

export type Order = {
  id: number
  clientId: number
  orderNumber: string
  creationDate?: string
  deliveryDeadline?: string
  totalPricePln?: number
  status: string
  clientCompany?: string
  cargoTypes?: string
  routeId?: number | null
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

export type CreateOrderPayload = {
  clientId: number
  orderNumber: string
  deliveryDeadline?: string
  totalPricePln?: number
}

export type CreateOrderWithCargoPayload = CreateOrderPayload & {
  cargoItems: CargoPayload[]
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
    mutationFn: async (
      payload: CreateOrderPayload | CreateOrderWithCargoPayload
    ) => {
      const orderPayload: CreateOrderPayload = {
        clientId: payload.clientId,
        orderNumber: payload.orderNumber,
        deliveryDeadline: payload.deliveryDeadline,
        totalPricePln: payload.totalPricePln,
      }
      const res = await api.post<Order>('/api/v1/orders', orderPayload)
      const order = res.data

      const cargoItems =
        'cargoItems' in payload ? payload.cargoItems : []
      for (const item of cargoItems) {
        await api.post(`/api/v1/orders/${order.id}/cargo`, {
          description: item.description || '',
          weightKg: item.weightKg,
          volumeM3: item.volumeM3,
          cargoType: item.cargoType,
        })
      }

      return order
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
