import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '@/services/api'
import { getStoredRole } from '@/services/authStorage'
import { isValidVin } from '@/utils/vin'

type Vehicle = {
  id: number
  vin: string
  plate_number?: string
  brand?: string
  model?: string
  production_year?: number
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
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null)
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

  const createMutation = useMutation({
    mutationFn: async (payload: {
      vin: string
      brand: string
      model: string
      production_year: number
      current_mileage_km: number
    }) => {
      const res = await api.post<Vehicle>('/api/v1/vehicles', payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      setAddModalOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number
      payload: {
        vin: string
        brand: string
        model: string
        production_year: number
        current_mileage_km: number
        status: string
      }
    }) => {
      const res = await api.put<Vehicle>(`/api/v1/vehicles/${id}`, payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      setEditVehicle(null)
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
        {(role === 'Administrator' || role === 'Mechanik') && (
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            Add vehicle
          </button>
        )}
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
                  <th className="px-4 py-3 font-medium text-gray-700">Production year</th>
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
                      <td className="px-4 py-3">
                        <Link
                          to={`/vehicles/${vehicle.id}`}
                          className="text-slate-700 underline-offset-2 hover:underline"
                        >
                          {vehicle.vin}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{vehicle.brand ?? '-'}</td>
                      <td className="px-4 py-3">{vehicle.model ?? '-'}</td>
                      <td className="px-4 py-3">{vehicle.production_year ?? '-'}</td>
                      <td className="px-4 py-3">{vehicle.current_mileage_km ?? 0}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1">
                          {isDeleted && <Trash2 className="size-3.5" />}
                          <span>{vehicle.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isAdmin && isDeleted && (
                            <button
                              type="button"
                              onClick={() => restoreMutation.mutate(vehicle.id)}
                              disabled={restoreMutation.isPending}
                              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
                            >
                              {restoreMutation.isPending ? 'Restoring...' : 'Restore'}
                            </button>
                          )}
                          {!isDeleted && (role === 'Administrator' || role === 'Mechanik') && (
                            <button
                              type="button"
                              onClick={() => setEditVehicle(vehicle)}
                              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                            >
                              Edit
                            </button>
                          )}
                          {!isDeleted &&
                            !(role === 'Administrator' || role === 'Mechanik') &&
                            !isAdmin && <span className="text-xs text-gray-400">-</span>}
                        </div>
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

      {addModalOpen && (
        <VehicleFormModal
          title="Add vehicle"
          submitLabel={createMutation.isPending ? 'Adding...' : 'Add'}
          onClose={() => setAddModalOpen(false)}
          onSubmit={(payload) => createMutation.mutate(payload)}
          isSubmitting={createMutation.isPending}
          errorMessage={extractApiError(createMutation.error)}
        />
      )}

      {editVehicle && (
        <VehicleFormModal
          title="Edit vehicle"
          submitLabel={updateMutation.isPending ? 'Saving...' : 'Save'}
          initialData={{
            vin: editVehicle.vin,
            brand: editVehicle.brand ?? '',
            model: editVehicle.model ?? '',
            production_year: editVehicle.production_year ?? new Date().getFullYear(),
            current_mileage_km: editVehicle.current_mileage_km ?? 0,
          }}
          onClose={() => setEditVehicle(null)}
          onSubmit={(payload) => {
            updateMutation.mutate({
              id: editVehicle.id,
              payload: {
                ...payload,
                status: editVehicle.status,
              },
            })
          }}
          isSubmitting={updateMutation.isPending}
          errorMessage={extractApiError(updateMutation.error)}
        />
      )}
    </div>
  )
}

type VehicleFormModalProps = {
  title: string
  submitLabel: string
  initialData?: {
    vin: string
    brand: string
    model: string
    production_year: number
    current_mileage_km: number
  }
  onClose: () => void
  onSubmit: (payload: {
    vin: string
    brand: string
    model: string
    production_year: number
    current_mileage_km: number
  }) => void
  isSubmitting: boolean
  errorMessage: string | null
}

function VehicleFormModal({
  title,
  submitLabel,
  initialData,
  onClose,
  onSubmit,
  isSubmitting,
  errorMessage,
}: VehicleFormModalProps) {
  const [vin, setVin] = useState(initialData?.vin ?? '')
  const [brand, setBrand] = useState(initialData?.brand ?? '')
  const [model, setModel] = useState(initialData?.model ?? '')
  const [productionYear, setProductionYear] = useState(
    initialData?.production_year?.toString() ?? String(new Date().getFullYear()),
  )
  const [mileage, setMileage] = useState(initialData?.current_mileage_km?.toString() ?? '0')
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = () => {
    const normalizedVIN = vin.trim().toUpperCase()
    if (!isValidVin(normalizedVIN)) {
      setLocalError('Invalid VIN format or checksum.')
      return
    }
    if (!brand.trim() || !model.trim()) {
      setLocalError('Brand and model are required.')
      return
    }

    const yearNumber = Number(productionYear)
    const mileageNumber = Number(mileage)
    if (!Number.isInteger(yearNumber) || yearNumber < 1900 || yearNumber > 2100) {
      setLocalError('Production year must be between 1900 and 2100.')
      return
    }
    if (!Number.isFinite(mileageNumber) || mileageNumber < 0) {
      setLocalError('Mileage must be a non-negative number.')
      return
    }

    setLocalError(null)
    onSubmit({
      vin: normalizedVIN,
      brand: brand.trim(),
      model: model.trim(),
      production_year: yearNumber,
      current_mileage_km: mileageNumber,
    })
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="mt-4 space-y-3">
          <FormField label="VIN">
            <input
              type="text"
              value={vin}
              onChange={(event) => setVin(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </FormField>
          <FormField label="Brand">
            <input
              type="text"
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </FormField>
          <FormField label="Model">
            <input
              type="text"
              value={model}
              onChange={(event) => setModel(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </FormField>
          <FormField label="Production year">
            <input
              type="number"
              value={productionYear}
              onChange={(event) => setProductionYear(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </FormField>
          <FormField label="Mileage (km)">
            <input
              type="number"
              value={mileage}
              onChange={(event) => setMileage(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </FormField>
        </div>
        {(localError || errorMessage) && (
          <p className="mt-3 text-sm text-red-600">{localError ?? errorMessage}</p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function FormField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
    </div>
  )
}

function extractApiError(error: unknown): string | null {
  if (!error) return null
  const maybe = error as { response?: { data?: { error?: string } } }
  return maybe.response?.data?.error ?? 'Operation failed.'
}

export default VehiclesPage
