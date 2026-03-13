import type { Assignment } from '@/hooks/assignments/useAssignments'
import type { PaginationHelpers } from '@/hooks/usePagination'
import { DataTablePagination } from '@/components/ui/DataTablePagination'
import { Button } from '@/components/ui/Button'
import { formatDateTime } from '@/utils/date'

type AssignmentsTableProps = {
  assignments: Assignment[]
  page: number
  total: number
  pagination: Pick<
    PaginationHelpers,
    'totalPages' | 'canGoPrev' | 'canGoNext' | 'goPrev' | 'goNext'
  >
  showActions?: boolean
  onEndAssignment?: (assignmentId: number) => void
  isEnding?: boolean
}

export function AssignmentsTable({
  assignments,
  page,
  total,
  pagination,
  showActions = false,
  onEndAssignment,
  isEnding,
}: AssignmentsTableProps) {
  return (
    <DataTablePagination page={page} total={total} pagination={pagination}>
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-700">
                  Assignment ID
                </th>
                <th className="px-4 py-3 font-medium text-gray-700">Vehicle</th>
                <th className="px-4 py-3 font-medium text-gray-700">Driver</th>
                <th className="px-4 py-3 font-medium text-gray-700">
                  Assigned from
                </th>
                <th className="px-4 py-3 font-medium text-gray-700">
                  Assigned to
                </th>
                {showActions && (
                  <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {assignments.map((a) => (
                <tr key={a.assignment_id}>
                  <td className="px-4 py-3">{a.assignment_id}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-mono text-xs text-gray-800">
                        {a.vehicle_vin}
                      </span>
                      {(a.vehicle_brand || a.vehicle_model) && (
                        <span className="text-xs text-gray-500">
                          {[a.vehicle_brand, a.vehicle_model]
                            .filter(Boolean)
                            .join(' ')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">{a.driver_name ?? a.driver_id}</td>
                  <td className="px-4 py-3">
                    {formatDateTime(a.assigned_from)}
                  </td>
                  <td className="px-4 py-3">
                    {a.assigned_to ? formatDateTime(a.assigned_to) : 'Active'}
                  </td>
                  {showActions && (
                    <td className="px-4 py-3">
                      {onEndAssignment && !a.assigned_to && (
                        <Button
                          variant="secondary"
                          className="px-3 py-1 text-xs"
                          onClick={() => onEndAssignment(a.assignment_id)}
                          disabled={isEnding}
                        >
                          {isEnding ? 'Ending...' : 'End assignment'}
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DataTablePagination>
  )
}

