import { Globe, DollarSign, Fuel, Wrench, ShieldCheck, Map, Package } from 'lucide-react'
import { ThWithIcon } from '@/components/ui/ThWithIcon'
import { HorizontalBarRow } from '@/components/reports/HorizontalBarRow'
import type { GlobalCostsReport } from '@/types/reports'
import { formatPrice } from '@/utils/price'

type GlobalCostsResultProps = {
  data: GlobalCostsReport
}

export function GlobalCostsResult({ data }: GlobalCostsResultProps) {
  const costs = data.costs_by_category
  const costMax = Math.max(
    costs.fuel, costs.maintenance, costs.insurance, costs.tolls, costs.other, data.total || 1,
  )

  return (
    <div className="space-y-6">
      <h3 className="flex items-center gap-2 text-lg font-medium text-gray-900">
        <Globe className="size-5 text-gray-500" aria-hidden="true" />
        Results
      </h3>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <ThWithIcon icon={Package}>Category</ThWithIcon>
              <ThWithIcon icon={DollarSign}>Amount</ThWithIcon>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr className="transition-colors hover:bg-gray-50">
              <td className="px-4 py-2 text-gray-600">Period</td>
              <td className="px-4 py-2">{data.period}</td>
            </tr>
            <tr className="transition-colors hover:bg-gray-50">
              <td className="px-4 py-2 text-gray-600">Fuel</td>
              <td className="px-4 py-2 tabular-nums">{formatPrice(costs.fuel)}</td>
            </tr>
            <tr className="transition-colors hover:bg-gray-50">
              <td className="px-4 py-2 text-gray-600">Maintenance</td>
              <td className="px-4 py-2 tabular-nums">{formatPrice(costs.maintenance)}</td>
            </tr>
            <tr className="transition-colors hover:bg-gray-50">
              <td className="px-4 py-2 text-gray-600">Insurance</td>
              <td className="px-4 py-2 tabular-nums">{formatPrice(costs.insurance)}</td>
            </tr>
            <tr className="transition-colors hover:bg-gray-50">
              <td className="px-4 py-2 text-gray-600">Tolls</td>
              <td className="px-4 py-2 tabular-nums">{formatPrice(costs.tolls)}</td>
            </tr>
            <tr className="transition-colors hover:bg-gray-50">
              <td className="px-4 py-2 text-gray-600">Other</td>
              <td className="px-4 py-2 tabular-nums">{formatPrice(costs.other)}</td>
            </tr>
            <tr className="transition-colors hover:bg-gray-50">
              <td className="px-4 py-2 font-medium text-gray-800">Total</td>
              <td className="px-4 py-2 tabular-nums font-medium">{formatPrice(data.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <h4 className="mb-3 flex items-center gap-1.5 text-sm font-medium text-gray-800">
          <DollarSign className="size-4 text-gray-500" aria-hidden="true" />
          Cost mix (chart)
        </h4>
        <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
          <HorizontalBarRow label="Fuel" value={costs.fuel} max={costMax} icon={Fuel} />
          <HorizontalBarRow label="Maintenance" value={costs.maintenance} max={costMax} icon={Wrench} />
          <HorizontalBarRow label="Insurance" value={costs.insurance} max={costMax} icon={ShieldCheck} />
          <HorizontalBarRow label="Tolls" value={costs.tolls} max={costMax} icon={Map} />
          <HorizontalBarRow label="Other" value={costs.other} max={costMax} icon={Package} />
        </div>
      </div>
    </div>
  )
}
