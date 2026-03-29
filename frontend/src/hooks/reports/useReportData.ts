import { useQuery } from '@tanstack/react-query'
import { fetchReportData } from '@/services/reports'
import { isReportQueryReady } from '@/schemas/reports'

export function useReportData(searchParams: URLSearchParams) {
  const ready = isReportQueryReady(searchParams)
  const key = searchParams.toString()

  return useQuery({
    queryKey: ['report-data', key],
    queryFn: () => fetchReportData(new URLSearchParams(key)),
    enabled: ready,
  })
}
