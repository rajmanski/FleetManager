import { useQuery } from '@tanstack/react-query'
import { fetchDashboardKpi } from '@/services/dashboard'

export function useDashboardKpi() {
  return useQuery({
    queryKey: ['dashboard-kpi'],
    queryFn: fetchDashboardKpi,
  })
}
