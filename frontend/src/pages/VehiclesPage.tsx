import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import api from '@/services/api'
import { getStoredRole } from '@/services/authStorage'

type Vehicle = {
  id: number
  vin: string
  plate_number?: string
  brand?: string
  model?: string
  capacity_kg?: number
  current_mileage_km?: number
  status: string
  deleted_at?: string
}

type ListVehiclesResponse = {
  data: Vehicle[]
  page: number
  limit: number
  total: number
}

function VehiclesPage() {
  const role = getStoredRole()
  const isAdmin = role === 'Administrator'
  const [showDeleted, setShowDeleted] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const queryClient = useQueryClient()

  const vehiclesQuery = useQuery({
    queryKey: ['vehicles', { showDeleted, statusFilter, search, page, limit }],
    queryFn: async () => {
      const res = await api.get<ListVehiclesResponse>('/api/v1/vehicles', {
        params: {
          page,
          limit,
          status: statusFilter,
          q: search.trim(),
          include_deleted: isAdmin && showDeleted ? 'true' : 'false',
        },
      })
      return res.data
    },
  })

  const restoreMutation = useMutation({
    mutationFn: async (vehicleID: number) => {
      const res = await api.put<Vehicle>(`/api/v1/vehicles/${vehicleID}/restore`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })

  const vehicles = useMemo(() => vehiclesQuery.data?.data ?? [], [vehiclesQuery.data])
  const total = vehiclesQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const canGoPrev = page > 1
  const canGoNext = page < totalPages

  const handlePrevPage = () => {
    if (canGoPrev) setPage((prev) => prev - 1)
  }

  const handleNextPage = () => {
    if (canGoNext) setPage((prev) => prev + 1)
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleLimitChange = (value: number) => {
    setLimit(value)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2>Vehicles</h2>
          <p className="text-gray-600">Fleet vehicles list with archived records handling</p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div className="min-w-44">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(event) => handleStatusFilterChange(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="Available">Available</option>
            <option value="InRoute">InRoute</option>
            <option value="Service">Service</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="min-w-56 flex-1">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
            Search
          </label>
          <input
            type="text"
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search by VIN or brand"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="min-w-32">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
            Rows
          </label>
          <select
            value={limit}
            onChange={(event) => handleLimitChange(Number(event.target.value))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        {isAdmin && (
          <label className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(event) => {
                setShowDeleted(event.target.checked)
                setPage(1)
              }}
            />
            Show deleted
          </label>
        )}
      </div>

      {vehiclesQuery.isLoading && <p className="text-sm text-gray-500">Loading...</p>}
      {vehiclesQuery.isError && (
        <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">
          Failed to load vehicles.
        </p>
      )}

      {vehiclesQuery.isSuccess && (
        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            Showing page {page} of {totalPages} ({total} results)
          </div>
          <div className="rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-700">VIN</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Brand</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Model</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Mileage (km)</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {vehicles.map((vehicle) => {
                  const isDeleted = Boolean(vehicle.deleted_at)
                  return (
                    <tr key={vehicle.id} className={isDeleted ? 'bg-gray-100 text-gray-500' : ''}>
                      <td className="px-4 py-3">{vehicle.vin}</td>
                      <td className="px-4 py-3">{vehicle.brand ?? '-'}</td>
                      <td className="px-4 py-3">{vehicle.model ?? '-'}</td>
                      <td className="px-4 py-3">{vehicle.current_mileage_km ?? 0}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1">
                          {isDeleted && <Trash2 className="size-3.5" />}
                          <span>{vehicle.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isAdmin && isDeleted ? (
                          <button
                            type="button"
                            onClick={() => restoreMutation.mutate(vehicle.id)}
                            disabled={restoreMutation.isPending}
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
                          >
                            {restoreMutation.isPending ? 'Restoring...' : 'Restore'}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={!canGoPrev}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={!canGoNext}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default VehiclesPage
