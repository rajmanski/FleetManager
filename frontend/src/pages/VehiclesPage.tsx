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
  const queryClient = useQueryClient()

  const vehiclesQuery = useQuery({
    queryKey: ['vehicles', { showDeleted }],
    queryFn: async () => {
      const res = await api.get<ListVehiclesResponse>('/api/v1/vehicles', {
        params: {
          page: 1,
          limit: 100,
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2>Vehicles</h2>
          <p className="text-gray-600">Fleet vehicles list with archived records handling</p>
        </div>
        {isAdmin && (
          <label className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(event) => setShowDeleted(event.target.checked)}
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
      )}
    </div>
  )
}

export default VehiclesPage
