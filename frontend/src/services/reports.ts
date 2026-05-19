import type { AxiosResponse } from 'axios'
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

  return extractExcelBlob(res, `vehicle-profitability-${vehicleId}-${month}.xlsx`)
}

export async function downloadDriverMileageExcel(
  driverId: number,
  dateFrom: string,
  dateTo: string,
): Promise<{ blob: Blob; filename: string }> {
  const res = await api.get<Blob>('/api/v1/reports/driver-mileage/export', {
    params: { driver_id: driverId, date_from: dateFrom, date_to: dateTo },
    responseType: 'blob',
  })

  return extractExcelBlob(res, `driver-mileage-${driverId}.xlsx`)
}

export async function downloadGlobalCostsExcel(
  dateFrom: string,
  dateTo: string,
): Promise<{ blob: Blob; filename: string }> {
  const res = await api.get<Blob>('/api/v1/reports/global-costs/export', {
    params: { date_from: dateFrom, date_to: dateTo },
    responseType: 'blob',
  })

  return extractExcelBlob(res, `global-costs-${dateFrom}-${dateTo}.xlsx`)
}

async function extractExcelBlob(
  res: AxiosResponse<Blob>,
  fallbackFilename: string,
): Promise<{ blob: Blob; filename: string }> {
  const blob = res.data
  const contentType = (res.headers['content-type'] as string | undefined) ?? ''
  if (contentType.includes('application/json')) {
    const text = await blob.text()
    const j = JSON.parse(text) as { error?: string }
    throw new Error(j.error ?? 'Export failed')
  }

  let filename = fallbackFilename
  const cd = res.headers['content-disposition'] as string | undefined
  if (cd) {
    const m = /filename="([^"]+)"/.exec(cd) ?? /filename=([^;\s]+)/.exec(cd)
    if (m?.[1]) {
      filename = decodeURIComponent(m[1].replace(/"/g, ''))
    }
  }

  return { blob, filename }
}
