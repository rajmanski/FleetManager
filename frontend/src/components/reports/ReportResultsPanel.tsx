import { useCallback, useState } from 'react'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { VehicleProfitabilityResult } from '@/components/reports/VehicleProfitabilityResult'
import { DriverMileageResult } from '@/components/reports/DriverMileageResult'
import { GlobalCostsResult } from '@/components/reports/GlobalCostsResult'
import { useReportData } from '@/hooks/reports/useReportData'
import {
  downloadVehicleProfitabilityExcel,
  downloadDriverMileageExcel,
  downloadGlobalCostsExcel,
} from '@/services/reports'
import { isReportQueryReady } from '@/schemas/reports'
import { useToast } from '@/context/ToastContext'
import { extractApiError } from '@/utils/api'

type ReportResultsPanelProps = {
  searchParams: URLSearchParams
}

export function ReportResultsPanel({ searchParams }: ReportResultsPanelProps) {
  const toast = useToast()
  const ready = isReportQueryReady(searchParams)
  const report = useReportData(searchParams)
  const [exporting, setExporting] = useState(false)

  const handleExportExcel = useCallback(async () => {
    const reportType = searchParams.get('report')

    setExporting(true)
    try {
      let result: { blob: Blob; filename: string }

      if (reportType === 'vehicle-profitability') {
        const vehicleId = searchParams.get('vehicle_id')
        const month = searchParams.get('month')
        if (!vehicleId || !month) return
        result = await downloadVehicleProfitabilityExcel(Number(vehicleId), month)
      } else if (reportType === 'driver-mileage') {
        const driverId = searchParams.get('driver_id')
        const dateFrom = searchParams.get('date_from')
        const dateTo = searchParams.get('date_to')
        if (!driverId || !dateFrom || !dateTo) return
        result = await downloadDriverMileageExcel(Number(driverId), dateFrom, dateTo)
      } else {
        const dateFrom = searchParams.get('date_from')
        const dateTo = searchParams.get('date_to')
        if (!dateFrom || !dateTo) return
        result = await downloadGlobalCostsExcel(dateFrom, dateTo)
      }

      const url = URL.createObjectURL(result.blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      toast.error(extractApiError(e, 'Could not download Excel file.') ?? 'Could not download Excel file.')
    } finally {
      setExporting(false)
    }
  }, [searchParams, toast])

  if (!ready) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-4 py-8 text-center text-sm text-gray-500">
        Set all required parameters and click Apply to load the report.
      </div>
    )
  }

  if (report.isPending) {
    return <LoadingMessage message="Loading report…" />
  }

  if (report.isError) {
    return <ErrorMessage message={extractApiError(report.error, 'Could not load report.')} />
  }

  const result = report.data

  if (result.kind === 'vehicle-profitability') {
    return (
      <VehicleProfitabilityResult
        data={result.data}
        onExportExcel={handleExportExcel}
        exporting={exporting}
      />
    )
  }

  if (result.kind === 'driver-mileage') {
    return (
      <DriverMileageResult
        data={result.data}
        onExportExcel={handleExportExcel}
        exporting={exporting}
      />
    )
  }

  return (
    <GlobalCostsResult
      data={result.data}
      onExportExcel={handleExportExcel}
      exporting={exporting}
    />
  )
}
