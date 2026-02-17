import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
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

type VehicleMutationPayload = {
  vin: string
  plate_number?: string
  brand: string
  model: string
  production_year: number
  capacity_kg?: number
  current_mileage_km: number
  status: string
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
    mutationFn: async (payload: VehicleMutationPayload) => {
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
          <Detail label="Created at" value={formatDateTime(vehicle.created_at)} />
          <Detail label="Updated at" value={formatDateTime(vehicle.updated_at)} />
        </dl>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="mb-3 text-base font-semibold text-gray-800">Mileage history</h3>
        {typeof vehicle.current_mileage_km === 'number' ? (
          <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            <p>Current snapshot: {vehicle.current_mileage_km} km</p>
            <p className="text-xs text-gray-500">
              Recorded at: {formatDateTime(vehicle.updated_at ?? vehicle.created_at)}
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
            plate_number: vehicle.plate_number ?? '',
            brand: vehicle.brand ?? '',
            model: vehicle.model ?? '',
            production_year: vehicle.production_year ?? new Date().getFullYear(),
            capacity_kg: vehicle.capacity_kg?.toString() ?? '',
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
    plate_number: string
    brand: string
    model: string
    production_year: number
    capacity_kg: string
    current_mileage_km: number
  }
  status: string
  onClose: () => void
  onSubmit: (payload: VehicleMutationPayload) => void
  isSubmitting: boolean
  errorMessage: string | null
}

type VehicleFormValues = {
  vin: string
  plate_number: string
  brand: string
  model: string
  production_year: number
  capacity_kg: string
  current_mileage_km: number
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
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    defaultValues: {
      vin: initialData.vin,
      plate_number: initialData.plate_number,
      brand: initialData.brand,
      model: initialData.model,
      production_year: initialData.production_year,
      capacity_kg: initialData.capacity_kg,
      current_mileage_km: initialData.current_mileage_km,
    },
  })

  const onFormSubmit = (data: VehicleFormValues) => {
    const normalizedVIN = data.vin.trim().toUpperCase()
    const capacityValue = data.capacity_kg.trim()
    onSubmit({
      vin: normalizedVIN,
      plate_number: data.plate_number.trim() === '' ? undefined : data.plate_number.trim(),
      brand: data.brand.trim(),
      model: data.model.trim(),
      production_year: data.production_year,
      capacity_kg: capacityValue === '' ? undefined : Number(capacityValue),
      current_mileage_km: data.current_mileage_km,
      status,
    })
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold">{title}</h2>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit(onFormSubmit)}>
          <Field label="VIN" error={errors.vin?.message}>
            <input
              {...register('vin', {
                validate: (value) =>
                  isValidVin(value.trim().toUpperCase()) || 'Invalid VIN format or checksum.',
              })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            />
          </Field>
          <Field label="Plate number" error={errors.plate_number?.message}>
            <input
              {...register('plate_number')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            />
          </Field>
          <Field label="Brand" error={errors.brand?.message}>
            <input
              {...register('brand', {
                validate: (value) => value.trim() !== '' || 'Brand is required.',
              })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            />
          </Field>
          <Field label="Model" error={errors.model?.message}>
            <input
              {...register('model', {
                validate: (value) => value.trim() !== '' || 'Model is required.',
              })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            />
          </Field>
          <Field label="Production year" error={errors.production_year?.message}>
            <input
              type="number"
              {...register('production_year', {
                valueAsNumber: true,
                validate: (value) =>
                  (Number.isInteger(value) && value >= 1900 && value <= 2100) ||
                  'Production year must be between 1900 and 2100.',
              })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            />
          </Field>
          <Field label="Capacity (kg)" error={errors.capacity_kg?.message}>
            <input
              type="number"
              {...register('capacity_kg', {
                validate: (value) =>
                  value.trim() === '' ||
                  (Number.isInteger(Number(value)) && Number(value) >= 0) ||
                  'Capacity must be a non-negative integer.',
              })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            />
          </Field>
          <Field label="Mileage (km)" error={errors.current_mileage_km?.message}>
            <input
              type="number"
              {...register('current_mileage_km', {
                valueAsNumber: true,
                validate: (value) =>
                  (Number.isFinite(value) && value >= 0) || 'Mileage must be a non-negative number.',
              })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            />
          </Field>
          {errorMessage && <p className="mt-1 text-sm text-red-600">{errorMessage}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
            Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

function formatDateTime(value?: string): string {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function extractApiError(error: unknown): string | null {
  if (!error) return null
  const maybe = error as { response?: { data?: { error?: string } } }
  return maybe.response?.data?.error ?? 'Operation failed.'
}

export default VehicleDetailsPage
