import {
  BadgeInfo,
  Building2,
  ClipboardList,
  Mail,
  MapPin,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Client } from '@/hooks/clients/useClients'
import type { PaginationHelpers } from '@/hooks/usePagination'
import { DataTablePagination } from '@/components/ui/DataTablePagination'
import { TableActionsCell } from '@/components/ui/TableActionsCell'

type ClientsTableProps = {
  clients: Client[]
  page: number
  total: number
  pagination: Pick<PaginationHelpers, 'totalPages' | 'canGoPrev' | 'canGoNext' | 'goPrev' | 'goNext'>
  canManageClients: boolean
  isAdmin: boolean
  onEdit: (client: Client) => void
  onRestore: (clientId: number) => void
  isRestoring: boolean
}

export function ClientsTable({
  clients,
  page,
  total,
  pagination,
  canManageClients,
  isAdmin,
  onEdit,
  onRestore,
  isRestoring,
}: ClientsTableProps) {
  return (
    <DataTablePagination page={page} total={total} pagination={pagination}>
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-700">
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="size-4 text-slate-600" aria-hidden="true" />
                    Company name
                  </span>
                </th>
                <th className="px-4 py-3 font-medium text-gray-700">
                  <span className="inline-flex items-center gap-1.5">
                    <BadgeInfo className="size-4 text-slate-600" aria-hidden="true" />
                    NIP
                  </span>
                </th>
                <th className="px-4 py-3 font-medium text-gray-700">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4 text-slate-600" aria-hidden="true" />
                    Address
                  </span>
                </th>
                <th className="px-4 py-3 font-medium text-gray-700">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="size-4 text-slate-600" aria-hidden="true" />
                    Contact email
                  </span>
                </th>
                <th className="px-4 py-3 font-medium text-gray-700">
                  <span className="inline-flex items-center gap-1.5">
                    <ClipboardList className="size-4 text-slate-600" aria-hidden="true" />
                    Related data
                  </span>
                </th>
                <th className="px-4 py-3 font-medium text-gray-700">
                  <span className="inline-flex items-center gap-1.5">
                    <BadgeInfo className="size-4 text-slate-600" aria-hidden="true" />
                    Actions
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {clients.map((client) => {
                const isDeleted = Boolean(client.deletedAt)
                const rowClassName = isDeleted
                  ? 'bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 focus-within:bg-gray-200'
                  : 'bg-white transition-colors hover:bg-gray-50 focus-within:bg-gray-50'
                const ordersSearchValue = client.companyName || client.nip
                const ordersPath = `/orders?q=${encodeURIComponent(ordersSearchValue)}`
                return (
                  <tr key={client.id} className={rowClassName}>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2">
                        <Building2
                          className={`size-4 shrink-0 ${isDeleted ? 'text-gray-500' : 'text-slate-600'}`}
                          aria-hidden="true"
                        />
                        <span className="font-medium text-slate-700">{client.companyName}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">{client.nip}</td>
                    <td className="px-4 py-3">{client.address ?? '-'}</td>
                    <td className="px-4 py-3">{client.contactEmail ?? '-'}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={ordersPath}
                        className="text-slate-700 underline underline-offset-2 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                        aria-label={`Open filtered orders for client ${client.companyName}`}
                      >
                        View orders
                      </Link>
                    </td>
                    <td
                      className="px-4 py-3"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <TableActionsCell
                        isDeleted={isDeleted}
                        isAdmin={isAdmin}
                        canManage={canManageClients}
                        onRestore={() => onRestore(client.id)}
                        onEdit={() => onEdit(client)}
                        isRestoring={isRestoring}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DataTablePagination>
  )
}

