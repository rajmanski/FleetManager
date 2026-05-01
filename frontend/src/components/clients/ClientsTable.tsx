import {
  BadgeInfo,
  Building2,
  ClipboardList,
  Mail,
  MapPin,
} from 'lucide-react'
import type { Client } from '@/hooks/clients/useClients'
import type { PaginationHelpers } from '@/hooks/usePagination'
import { DataTablePagination } from '@/components/ui/DataTablePagination'
import { EntityCellLink } from '@/components/ui/EntityCellLink'
import { TableActionsCell } from '@/components/ui/TableActionsCell'
import { ThWithIcon } from '@/components/ui/ThWithIcon'

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
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm table-sticky-last-col">
            <thead className="bg-gray-50">
              <tr>
                <ThWithIcon icon={Building2}>Company name</ThWithIcon>
                <ThWithIcon icon={BadgeInfo}>NIP</ThWithIcon>
                <ThWithIcon icon={MapPin}>Address</ThWithIcon>
                <ThWithIcon icon={Mail}>Contact email</ThWithIcon>
                <ThWithIcon icon={ClipboardList}>Related data</ThWithIcon>
                <ThWithIcon icon={BadgeInfo}>Actions</ThWithIcon>
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
                      <EntityCellLink
                        to={ordersPath}
                        className="text-slate-700 underline underline-offset-2 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                        ariaLabel={`Open filtered orders for client ${client.companyName}`}
                      >
                        View orders
                      </EntityCellLink>
                    </td>
                    <td className="px-4 py-3">
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

