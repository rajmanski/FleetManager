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
                <th className="px-4 py-3 font-medium text-gray-700">Company name</th>
                <th className="px-4 py-3 font-medium text-gray-700">NIP</th>
                <th className="px-4 py-3 font-medium text-gray-700">Address</th>
                <th className="px-4 py-3 font-medium text-gray-700">Contact email</th>
                <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {clients.map((client) => {
                const isDeleted = Boolean(client.deletedAt)
                return (
                  <tr key={client.id} className={isDeleted ? 'bg-gray-100 text-gray-500' : ''}>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-700">{client.companyName}</span>
                    </td>
                    <td className="px-4 py-3">{client.nip}</td>
                    <td className="px-4 py-3">{client.address ?? '-'}</td>
                    <td className="px-4 py-3">{client.contactEmail ?? '-'}</td>
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

