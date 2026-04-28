import { useCallback, useState } from 'react'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { VehicleProfitabilityResult } from '@/components/reports/VehicleProfitabilityResult'
import { DriverMileageResult } from '@/components/reports/DriverMileageResult'
import { GlobalCostsResult } from '@/components/reports/GlobalCostsResult'
import { useReportData } from '@/hooks/reports/useReportData'
import { downloadVehicleProfitabilityExcel } from '@/services/reports'
import { isReportQueryReady } from '@/schemas/reports'
import { extractApiError } from '@/utils/api'

type ReportResultsPanelProps = {
  searchParams: URLSearchParams
}

export function ReportResultsPanel({ searchParams }: ReportResultsPanelProps) {
  const ready = isReportQueryReady(searchParams)
  const report = useReportData(searchParams)
  const [exportError, setExportError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const handleExportExcel = useCallback(async () => {
    const vehicleId = searchParams.get('vehicle_id')
    const month = searchParams.get('month')
    if (!vehicleId || !month) return
    setExportError(null)
    setExporting(true)
    try {
      const { blob, filename } = await downloadVehicleProfitabilityExcel(
        Number(vehicleId), month,
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setExportError(extractApiError(e, 'Could not download Excel file.'))
    } finally {
      setExporting(false)
    }
  }, [searchParams])

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
        exporting={exporting}
        exportError={exportError}
        onExportExcel={handleExportExcel}
      />
    )
  }

  if (result.kind === 'driver-mileage') {
    return <DriverMileageResult data={result.data} />
  }

  return <GlobalCostsResult data={result.data} />
}
