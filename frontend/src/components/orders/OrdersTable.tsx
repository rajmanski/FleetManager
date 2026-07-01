import {
  Hash,
  FileText,
  Building2,
  Package,
  CircleDot,
  Calendar,
  Banknote,
  ChevronRight,
} from 'lucide-react'
import { ThWithIcon } from '@/components/ui/ThWithIcon'
import { SortableTh } from '@/components/ui/SortableTh'
import type { SortConfig } from '@/components/ui/SortableTh'
import { useClickableRow } from '@/hooks/useClickableRow'
import type { Order } from '@/hooks/orders/useOrders'
import type { PaginationHelpers } from '@/hooks/usePagination'
import { DataTablePagination } from '@/components/ui/DataTablePagination'
import { CargoTypeBadges } from '@/components/orders/CargoTypeBadges'
import { formatDateTime } from '@/utils/date'
import { formatPrice } from '@/utils/price'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'

type OrdersTableProps = {
  orders: Order[]
  page: number
  total: number
  pagination: Pick<PaginationHelpers, 'totalPages' | 'canGoPrev' | 'canGoNext' | 'goPrev' | 'goNext'>
  sortConfig: SortConfig
  onSort: (column: string) => void
}

export function OrdersTable({
  orders,
  page,
  total,
  pagination,
  sortConfig,
  onSort,
}: OrdersTableProps) {
  const { getRowProps } = useClickableRow()

  return (
    <DataTablePagination page={page} total={total} pagination={pagination}>
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <SortableTh column="id" sortConfig={sortConfig} onSort={onSort} icon={Hash}>ID</SortableTh>
                <SortableTh column="orderNumber" sortConfig={sortConfig} onSort={onSort} icon={FileText}>Order number</SortableTh>
                <SortableTh column="clientCompany" sortConfig={sortConfig} onSort={onSort} icon={Building2}>Client</SortableTh>
                <ThWithIcon icon={Package}>Cargo type</ThWithIcon>
                <SortableTh column="status" sortConfig={sortConfig} onSort={onSort} icon={CircleDot}>Status</SortableTh>
                <SortableTh column="deliveryDeadline" sortConfig={sortConfig} onSort={onSort} icon={Calendar}>Delivery</SortableTh>
                <SortableTh column="totalPricePln" sortConfig={sortConfig} onSort={onSort} icon={Banknote}>Price</SortableTh>
                <th className="w-10 px-2" aria-hidden />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {orders.map((order) => (
                <tr
                  key={order.id}
                  {...getRowProps(`/orders/${order.id}`)}
                  className="cursor-pointer transition-colors hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {order.id}
                  </td>
                  <td className="px-4 py-3">{order.orderNumber}</td>
                  <td className="px-4 py-3">{order.clientCompany ?? '-'}</td>
                  <td className="px-4 py-3">
                    <CargoTypeBadges cargoTypesStr={order.cargoTypes} />
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3">
                    {formatDateTime(order.deliveryDeadline)}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatPrice(order.totalPricePln)}
                  </td>
                  <td className="w-10 px-2 py-3">
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DataTablePagination>
  )
}
