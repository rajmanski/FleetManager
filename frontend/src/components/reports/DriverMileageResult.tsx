import { Route, Package, DollarSign } from 'lucide-react'
import { EntityCellLink } from '@/components/ui/EntityCellLink'
import { ThWithIcon } from '@/components/ui/ThWithIcon'
import { useClickableRow } from '@/hooks/useClickableRow'
import type { DriverMileageReport } from '@/types/reports'

type DriverMileageResultProps = {
  data: DriverMileageReport
}

export function DriverMileageResult({ data }: DriverMileageResultProps) {
  const { getRowProps } = useClickableRow()

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-lg font-medium text-gray-900">
        <Route className="size-5 text-gray-500" aria-hidden="true" />
        Results
      </h3>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <ThWithIcon icon={Package}>Field</ThWithIcon>
              <ThWithIcon icon={DollarSign}>Value</ThWithIcon>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr
              {...getRowProps(`/drivers/${data.driver_id}`)}
              className="cursor-pointer transition-colors hover:bg-gray-50"
            >
              <td className="px-4 py-2 text-gray-600">Driver ID</td>
              <td className="px-4 py-2 tabular-nums">
                <EntityCellLink to={`/drivers/${data.driver_id}`}>
                  {data.driver_id}
                </EntityCellLink>
              </td>
            </tr>
            <tr className="transition-colors hover:bg-gray-50">
              <td className="px-4 py-2 text-gray-600">Period</td>
              <td className="px-4 py-2">{data.period}</td>
            </tr>
            <tr className="transition-colors hover:bg-gray-50">
              <td className="px-4 py-2 text-gray-600">Total distance (km)</td>
              <td className="px-4 py-2 tabular-nums">{data.total_km.toLocaleString()}</td>
            </tr>
            <tr className="transition-colors hover:bg-gray-50">
              <td className="px-4 py-2 text-gray-600">Orders (distinct)</td>
              <td className="px-4 py-2 tabular-nums">{data.orders_count}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
