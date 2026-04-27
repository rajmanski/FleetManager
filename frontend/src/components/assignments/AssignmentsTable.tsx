import { CalendarClock, UserCheck, Truck, Users, CircleCheckBig, Ban } from 'lucide-react'
import { Link } from 'react-router-dom'
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
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-4 text-slate-600" aria-hidden="true" />
                    Assignment ID
                  </span>
                </th>
                <th className="px-4 py-3 font-medium text-gray-700">
                  <span className="inline-flex items-center gap-1.5">
                    <Truck className="size-4 text-slate-600" aria-hidden="true" />
                    Vehicle
                  </span>
                </th>
                <th className="px-4 py-3 font-medium text-gray-700">
                  <span className="inline-flex items-center gap-1.5">
                    <UserCheck className="size-4 text-slate-600" aria-hidden="true" />
                    Driver
                  </span>
                </th>
                <th className="px-4 py-3 font-medium text-gray-700">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="size-4 text-slate-600" aria-hidden="true" />
                    Assigned from
                  </span>
                </th>
                <th className="px-4 py-3 font-medium text-gray-700">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="size-4 text-slate-600" aria-hidden="true" />
                    Assigned to
                  </span>
                </th>
                {showActions && (
                  <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {assignments.map((a) => {
                const isActive = !a.assigned_to
                return (
                  <tr
                    key={a.assignment_id}
                    className="transition-colors hover:bg-gray-50 focus-within:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2">
                        {isActive ? (
                          <CircleCheckBig className="size-4 shrink-0 text-green-600" aria-hidden="true" />
                        ) : (
                          <Ban className="size-4 shrink-0 text-gray-400" aria-hidden="true" />
                        )}
                        <span>{a.assignment_id}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/vehicles/${a.vehicle_id}`}
                        className="underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 rounded"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="flex flex-col">
                          <span className="font-mono text-xs text-slate-700">
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
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/drivers/${a.driver_id}`}
                        className="text-slate-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 rounded"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {a.driver_name ?? a.driver_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {formatDateTime(a.assigned_from)}
                    </td>
                    <td className="px-4 py-3">
                      {a.assigned_to ? formatDateTime(a.assigned_to) : 'Active'}
                    </td>
                    {showActions && (
                      <td
                        className="px-4 py-3"
                        onClick={(event) => event.stopPropagation()}
                      >
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
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DataTablePagination>
  )
}

