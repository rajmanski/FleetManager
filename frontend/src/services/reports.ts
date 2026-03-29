import api from '@/services/api'
import type {
  DriverMileageReport,
  GlobalCostsReport,
  ReportFetchResult,
  VehicleProfitabilityReport,
} from '@/types/reports'

export async function fetchReportData(search: URLSearchParams): Promise<ReportFetchResult> {
  const report = search.get('report') ?? 'vehicle-profitability'

  if (report === 'vehicle-profitability') {
    const { data } = await api.get<VehicleProfitabilityReport>(
      '/api/v1/reports/vehicle-profitability',
      {
        params: {
          vehicle_id: search.get('vehicle_id'),
          month: search.get('month'),
        },
      },
    )
    return { kind: 'vehicle-profitability', data }
  }

  if (report === 'driver-mileage') {
    const { data } = await api.get<DriverMileageReport>('/api/v1/reports/driver-mileage', {
      params: {
        driver_id: search.get('driver_id'),
        date_from: search.get('date_from'),
        date_to: search.get('date_to'),
      },
    })
    return { kind: 'driver-mileage', data }
  }

  const { data } = await api.get<GlobalCostsReport>('/api/v1/reports/global-costs', {
    params: {
      date_from: search.get('date_from'),
      date_to: search.get('date_to'),
    },
  })
  return { kind: 'global-costs', data }
}

export async function downloadVehicleProfitabilityExcel(
  vehicleId: number,
  month: string,
): Promise<{ blob: Blob; filename: string }> {
  const res = await api.get<Blob>('/api/v1/reports/vehicle-profitability/export', {
    params: { vehicle_id: vehicleId, month },
    responseType: 'blob',
  })

  const blob = res.data
  const contentType = res.headers['content-type'] ?? ''
  if (contentType.includes('application/json')) {
    const text = await blob.text()
    const j = JSON.parse(text) as { error?: string }
    throw new Error(j.error ?? 'Export failed')
  }

  let filename = `vehicle-profitability-${vehicleId}-${month}.xlsx`
  const cd = res.headers['content-disposition']
  if (cd) {
    const m = /filename="([^"]+)"/.exec(cd) ?? /filename=([^;\s]+)/.exec(cd)
    if (m?.[1]) {
      filename = decodeURIComponent(m[1].replace(/"/g, ''))
    }
  }

  return { blob, filename }
}
