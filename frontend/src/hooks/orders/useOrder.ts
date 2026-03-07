import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import type { Order } from './useOrders'

export function useOrder(orderId: number | null) {
  const query = useQuery({
    queryKey: ['orders', orderId],
    queryFn: async () => {
      if (!orderId || orderId <= 0) return null
      const res = await api.get<Order>(`/api/v1/orders/${orderId}`)
      return res.data
    },
    enabled: orderId != null && orderId > 0,
  })

  return {
    orderQuery: query,
    order: query.data ?? null,
  }
}
