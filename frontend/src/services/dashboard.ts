import api from '@/services/api'
import type { DashboardKpi } from '@/types/dashboard'

export async function fetchDashboardKpi(): Promise<DashboardKpi> {
  const { data } = await api.get<DashboardKpi>('/api/v1/dashboard/kpi')
  return data
}
