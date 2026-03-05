import type { Order } from '@/hooks/orders/useOrders'
import type { PaginationHelpers } from '@/hooks/usePagination'
import { DataTablePagination } from '@/components/ui/DataTablePagination'
import { formatDateTime } from '@/utils/date'

type OrdersTableProps = {
  orders: Order[]
  page: number
  total: number
  pagination: Pick<PaginationHelpers, 'totalPages' | 'canGoPrev' | 'canGoNext' | 'goPrev' | 'goNext'>
}

function formatPrice(pln?: number): string {
  if (pln == null) return '-'
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2,
  }).format(pln)
}

export function OrdersTable({
  orders,
  page,
  total,
  pagination,
}: OrdersTableProps) {
  return (
    <DataTablePagination page={page} total={total} pagination={pagination}>
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-700">ID</th>
                <th className="px-4 py-3 font-medium text-gray-700">Order number</th>
                <th className="px-4 py-3 font-medium text-gray-700">Client</th>
                <th className="px-4 py-3 font-medium text-gray-700">Cargo type</th>
                <th className="px-4 py-3 font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 font-medium text-gray-700">Delivery deadline</th>
                <th className="px-4 py-3 font-medium text-gray-700">Total price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 font-medium text-slate-700">{order.id}</td>
                  <td className="px-4 py-3">{order.orderNumber}</td>
                  <td className="px-4 py-3">{order.clientCompany ?? '-'}</td>
                  <td className="px-4 py-3">{'-'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        order.status === 'Completed'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'Cancelled'
                            ? 'bg-red-100 text-red-800'
                            : order.status === 'InProgress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatDateTime(order.deliveryDeadline)}</td>
                  <td className="px-4 py-3">{formatPrice(order.totalPricePln)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DataTablePagination>
  )
}
