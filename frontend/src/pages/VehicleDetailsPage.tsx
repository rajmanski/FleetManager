import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
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
  created_at?: string
  updated_at?: string
}

function VehicleDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const role = getStoredRole()
  const canManage = role === 'Administrator' || role === 'Mechanik'
  const [editOpen, setEditOpen] = useState(false)

  const vehicleID = Number(id)

  const vehicleQuery = useQuery({
    queryKey: ['vehicle', vehicleID],
    queryFn: async () => {
      const res = await api.get<Vehicle>(`/api/v1/vehicles/${vehicleID}`)
      return res.data
    },
    enabled: Number.isFinite(vehicleID) && vehicleID > 0,
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/api/v1/vehicles/${vehicleID}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      navigate('/vehicles', { replace: true })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (payload: {
      vin: string
      brand: string
      model: string
      production_year: number
      current_mileage_km: number
      status: string
    }) => {
      const res = await api.put<Vehicle>(`/api/v1/vehicles/${vehicleID}`, payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleID] })
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      setEditOpen(false)
    },
  })

  if (!Number.isFinite(vehicleID) || vehicleID <= 0) {
    return <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">Invalid vehicle id.</p>
  }

  if (vehicleQuery.isLoading) {
    return <p className="text-sm text-gray-500">Loading vehicle details...</p>
  }

  if (vehicleQuery.isError || !vehicleQuery.data) {
    return (
      <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">
        Failed to load vehicle details.
      </p>
    )
  }

  const vehicle = vehicleQuery.data
  const isDeleted = Boolean(vehicle.deleted_at)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2>Vehicle details</h2>
          <p className="text-gray-600">Full vehicle data and availability information</p>
        </div>
        <Link
          to="/vehicles"
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Back to list
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Detail label="VIN" value={vehicle.vin} />
          <Detail label="Status" value={vehicle.status} />
          <Detail label="Brand" value={vehicle.brand ?? '-'} />
          <Detail label="Model" value={vehicle.model ?? '-'} />
          <Detail label="Production year" value={vehicle.production_year ? String(vehicle.production_year) : '-'} />
          <Detail label="Mileage (km)" value={String(vehicle.current_mileage_km ?? 0)} />
          <Detail label="Capacity (kg)" value={vehicle.capacity_kg ? String(vehicle.capacity_kg) : '-'} />
          <Detail label="Plate number" value={vehicle.plate_number ?? '-'} />
          <Detail label="Created at" value={vehicle.created_at ?? '-'} />
          <Detail label="Updated at" value={vehicle.updated_at ?? '-'} />
        </dl>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="mb-3 text-base font-semibold text-gray-800">Mileage history</h3>
        {typeof vehicle.current_mileage_km === 'number' ? (
          <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            <p>Current snapshot: {vehicle.current_mileage_km} km</p>
            <p className="text-xs text-gray-500">
              Recorded at: {vehicle.updated_at ?? vehicle.created_at ?? 'unknown'}
            </p>
            <p className="mt-2 text-xs text-gray-500">Detailed mileage history is not available yet.</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Mileage history is not available for this vehicle.</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {canManage && !isDeleted && (
          <>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Edit vehicle
            </button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete vehicle'}
            </button>
          </>
        )}
      </div>

      {deleteMutation.error && (
        <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">
          {(deleteMutation.error as { response?: { data?: { error?: string } } })?.response?.data
            ?.error ?? 'Delete failed.'}
        </p>
      )}

      {editOpen && (
        <VehicleFormModal
          title="Edit vehicle"
          submitLabel={updateMutation.isPending ? 'Saving...' : 'Save'}
          initialData={{
            vin: vehicle.vin,
            brand: vehicle.brand ?? '',
            model: vehicle.model ?? '',
            production_year: vehicle.production_year ?? new Date().getFullYear(),
            current_mileage_km: vehicle.current_mileage_km ?? 0,
          }}
          status={vehicle.status}
          onClose={() => setEditOpen(false)}
          onSubmit={(payload) => updateMutation.mutate(payload)}
          isSubmitting={updateMutation.isPending}
          errorMessage={extractApiError(updateMutation.error)}
        />
      )}
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-800">{value}</dd>
    </div>
  )
}

type VehicleFormModalProps = {
  title: string
  submitLabel: string
  initialData: {
    vin: string
    brand: string
    model: string
    production_year: number
    current_mileage_km: number
  }
  status: string
  onClose: () => void
  onSubmit: (payload: {
    vin: string
    brand: string
    model: string
    production_year: number
    current_mileage_km: number
    status: string
  }) => void
  isSubmitting: boolean
  errorMessage: string | null
}

function VehicleFormModal({
  title,
  submitLabel,
  initialData,
  status,
  onClose,
  onSubmit,
  isSubmitting,
  errorMessage,
}: VehicleFormModalProps) {
  const [vin, setVin] = useState(initialData.vin)
  const [brand, setBrand] = useState(initialData.brand)
  const [model, setModel] = useState(initialData.model)
  const [productionYear, setProductionYear] = useState(initialData.production_year.toString())
  const [mileage, setMileage] = useState(initialData.current_mileage_km.toString())
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
      status,
    })
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="mt-4 space-y-3">
          <Field label="VIN">
            <input value={vin} onChange={(e) => setVin(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </Field>
          <Field label="Brand">
            <input value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </Field>
          <Field label="Model">
            <input value={model} onChange={(e) => setModel(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </Field>
          <Field label="Production year">
            <input type="number" value={productionYear} onChange={(e) => setProductionYear(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </Field>
          <Field label="Mileage (km)">
            <input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </Field>
        </div>
        {(localError || errorMessage) && (
          <p className="mt-3 text-sm text-red-600">{localError ?? errorMessage}</p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60">
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
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

export default VehicleDetailsPage
