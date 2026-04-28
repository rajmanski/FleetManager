import { Download, TrendingUp, DollarSign, Fuel, Wrench, ShieldCheck, Map, Package } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EntityCellLink } from '@/components/ui/EntityCellLink'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { ThWithIcon } from '@/components/ui/ThWithIcon'
import { useClickableRow } from '@/hooks/useClickableRow'
import { HorizontalBarRow } from '@/components/reports/HorizontalBarRow'
import type { VehicleProfitabilityReport } from '@/types/reports'
import { formatPrice } from '@/utils/price'

type VehicleProfitabilityResultProps = {
  data: VehicleProfitabilityReport
  exporting: boolean
  exportError: string | null
  onExportExcel: () => void
}

export function VehicleProfitabilityResult({
  data, exporting, exportError, onExportExcel,
}: VehicleProfitabilityResultProps) {
  const costs = data.costs
  const costMax = Math.max(
    costs.fuel, costs.maintenance, costs.insurance, costs.tolls, costs.total || 1,
  )
  const { getRowProps } = useClickableRow()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-lg font-medium text-gray-900">
          <TrendingUp className="size-5 text-gray-500" aria-hidden="true" />
          Results
        </h3>
        <Button
          type="button"
          variant="secondary"
          disabled={exporting}
          onClick={onExportExcel}
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
              <ThWithIcon icon={Package}>Metric</ThWithIcon>
              <ThWithIcon icon={DollarSign}>Value</ThWithIcon>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr
              {...getRowProps(`/vehicles/${data.vehicle_id}`)}
              className="cursor-pointer transition-colors hover:bg-gray-50"
            >
              <td className="px-4 py-2 text-gray-600">Vehicle ID</td>
              <td className="px-4 py-2 tabular-nums">
                <EntityCellLink to={`/vehicles/${data.vehicle_id}`}>
                  {data.vehicle_id}
                </EntityCellLink>
              </td>
            </tr>
            <tr className="transition-colors hover:bg-gray-50">
              <td className="px-4 py-2 text-gray-600">Month</td>
              <td className="px-4 py-2">{data.month}</td>
            </tr>
            <tr className="transition-colors hover:bg-gray-50">
              <td className="px-4 py-2 text-gray-600">Revenue</td>
              <td className="px-4 py-2 tabular-nums">{formatPrice(data.revenue)}</td>
            </tr>
            <tr className="transition-colors hover:bg-gray-50">
              <td className="px-4 py-2 text-gray-600">Total costs</td>
              <td className="px-4 py-2 tabular-nums">{formatPrice(costs.total)}</td>
            </tr>
            <tr className="transition-colors hover:bg-gray-50">
              <td className="px-4 py-2 text-gray-600">Profit</td>
              <td className="px-4 py-2 tabular-nums font-medium">{formatPrice(data.profit)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <h4 className="mb-3 flex items-center gap-1.5 text-sm font-medium text-gray-800">
          <DollarSign className="size-4 text-gray-500" aria-hidden="true" />
          Cost breakdown
        </h4>
        <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
          <HorizontalBarRow label="Fuel" value={costs.fuel} max={costMax} icon={Fuel} />
          <HorizontalBarRow label="Maintenance" value={costs.maintenance} max={costMax} icon={Wrench} />
          <HorizontalBarRow label="Insurance" value={costs.insurance} max={costMax} icon={ShieldCheck} />
          <HorizontalBarRow label="Tolls" value={costs.tolls} max={costMax} icon={Map} />
        </div>
      </div>
    </div>
  )
}
