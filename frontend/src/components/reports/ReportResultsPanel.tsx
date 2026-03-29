import { useCallback, useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { useReportData } from '@/hooks/reports/useReportData'
import { downloadVehicleProfitabilityExcel } from '@/services/reports'
import { isReportQueryReady } from '@/schemas/reports'
import { extractApiError } from '@/utils/api'
import { formatPrice } from '@/utils/price'

function HorizontalBarRow({
  label,
  value,
  max,
}: {
  label: string
  value: number
  max: number
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-36 shrink-0 text-gray-600">{label}</span>
      <div className="min-w-0 flex-1">
        <div className="h-2.5 overflow-hidden rounded bg-gray-100">
          <div
            className="h-full min-w-0 rounded bg-slate-600 transition-[width]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className="w-28 shrink-0 text-right tabular-nums text-gray-900">
        {formatPrice(value)}
      </span>
    </div>
  )
}

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
        Number(vehicleId),
        month,
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
    return (
      <ErrorMessage
        message={extractApiError(report.error, 'Could not load report.')}
      />
    )
  }

  const result = report.data

  if (result.kind === 'vehicle-profitability') {
    const d = result.data
    const c = d.costs
    const costMax = Math.max(c.fuel, c.maintenance, c.insurance, c.tolls, c.total || 1)

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-medium text-gray-900">Results</h3>
          <Button
            type="button"
            variant="secondary"
            disabled={exporting}
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2"
          >
            <Download className="size-4" />
            {exporting ? 'Exporting…' : 'Export to Excel'}
          </Button>
        </div>
        {exportError && <ErrorMessage message={exportError} />}

        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-2 font-medium text-gray-700">Metric</th>
                <th className="px-4 py-2 font-medium text-gray-700">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-4 py-2 text-gray-600">Vehicle ID</td>
                <td className="px-4 py-2 tabular-nums">{d.vehicle_id}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-gray-600">Month</td>
                <td className="px-4 py-2">{d.month}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-gray-600">Revenue</td>
                <td className="px-4 py-2 tabular-nums">{formatPrice(d.revenue)}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-gray-600">Total costs</td>
                <td className="px-4 py-2 tabular-nums">{formatPrice(c.total)}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-gray-600">Profit</td>
                <td className="px-4 py-2 tabular-nums font-medium">{formatPrice(d.profit)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-medium text-gray-800">Cost breakdown</h4>
          <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
            <HorizontalBarRow label="Fuel" value={c.fuel} max={costMax} />
            <HorizontalBarRow label="Maintenance" value={c.maintenance} max={costMax} />
            <HorizontalBarRow label="Insurance" value={c.insurance} max={costMax} />
            <HorizontalBarRow label="Tolls" value={c.tolls} max={costMax} />
          </div>
        </div>
      </div>
    )
  }

  if (result.kind === 'driver-mileage') {
    const d = result.data
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Results</h3>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-2 font-medium text-gray-700">Field</th>
                <th className="px-4 py-2 font-medium text-gray-700">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-4 py-2 text-gray-600">Driver ID</td>
                <td className="px-4 py-2 tabular-nums">{d.driver_id}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-gray-600">Period</td>
                <td className="px-4 py-2">{d.period}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-gray-600">Total distance (km)</td>
                <td className="px-4 py-2 tabular-nums">{d.total_km.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-gray-600">Orders (distinct)</td>
                <td className="px-4 py-2 tabular-nums">{d.orders_count}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const d = result.data
  const cat = d.costs_by_category
  const catMax = Math.max(
    cat.fuel,
    cat.maintenance,
    cat.insurance,
    cat.tolls,
    cat.other,
    d.total || 1,
  )

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Results</h3>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-2 font-medium text-gray-700">Category</th>
              <th className="px-4 py-2 font-medium text-gray-700">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="px-4 py-2 text-gray-600">Period</td>
              <td className="px-4 py-2">{d.period}</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-gray-600">Fuel</td>
              <td className="px-4 py-2 tabular-nums">{formatPrice(cat.fuel)}</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-gray-600">Maintenance</td>
              <td className="px-4 py-2 tabular-nums">{formatPrice(cat.maintenance)}</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-gray-600">Insurance</td>
              <td className="px-4 py-2 tabular-nums">{formatPrice(cat.insurance)}</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-gray-600">Tolls</td>
              <td className="px-4 py-2 tabular-nums">{formatPrice(cat.tolls)}</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-gray-600">Other</td>
              <td className="px-4 py-2 tabular-nums">{formatPrice(cat.other)}</td>
            </tr>
            <tr>
              <td className="px-4 py-2 font-medium text-gray-800">Total</td>
              <td className="px-4 py-2 tabular-nums font-medium">{formatPrice(d.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-medium text-gray-800">Cost mix (chart)</h4>
        <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
          <HorizontalBarRow label="Fuel" value={cat.fuel} max={catMax} />
          <HorizontalBarRow label="Maintenance" value={cat.maintenance} max={catMax} />
          <HorizontalBarRow label="Insurance" value={cat.insurance} max={catMax} />
          <HorizontalBarRow label="Tolls" value={cat.tolls} max={catMax} />
          <HorizontalBarRow label="Other" value={cat.other} max={catMax} />
        </div>
      </div>
    </div>
  )
}
