import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ModalFooter } from '@/components/ui/ModalFooter'
import { Select } from '@/components/ui/Select'
import type { VehicleMutationPayload } from '@/hooks/vehicles/useVehicles'
import { VEHICLE_STATUSES } from '@/constants/vehicleStatuses'
import { getVehicleStatusMeta } from '@/utils/vehicleStatus'
import { isValidVin } from '@/utils/vin'

export type VehicleFormModalProps = {
  title: string
  submitLabel: string
  initialData?: {
    vin: string
    plate_number: string
    brand: string
    model: string
    production_year: number
    capacity_kg: string
    current_mileage_km: number
  }
  status?: string
  onClose: () => void
  onSubmit: (payload: VehicleMutationPayload & { status?: string }) => void
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

export function VehicleFormModal({
  title,
  submitLabel,
  initialData,
  status: initialStatus,
  onClose,
  onSubmit,
  isSubmitting,
  errorMessage,
}: VehicleFormModalProps) {
  const [selectedStatus, setSelectedStatus] = useState(initialStatus ?? 'Available')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    defaultValues: {
      vin: initialData?.vin ?? '',
      plate_number: initialData?.plate_number ?? '',
      brand: initialData?.brand ?? '',
      model: initialData?.model ?? '',
      production_year: initialData?.production_year ?? new Date().getFullYear(),
      capacity_kg: initialData?.capacity_kg ?? '',
      current_mileage_km: initialData?.current_mileage_km ?? 0,
    },
  })

  const onFormSubmit = (data: VehicleFormValues) => {
    const normalizedVIN = data.vin.trim().toUpperCase()
    const capacityValue = data.capacity_kg.trim()
    const payload: VehicleMutationPayload & { status?: string } = {
      vin: normalizedVIN,
      plate_number: data.plate_number.trim() === '' ? undefined : data.plate_number.trim(),
      brand: data.brand.trim(),
      model: data.model.trim(),
      production_year: data.production_year,
      capacity_kg: capacityValue === '' ? undefined : Number(capacityValue),
      current_mileage_km: data.current_mileage_km,
      status: selectedStatus,
    }
    onSubmit(payload)
  }
  const statusMeta = getVehicleStatusMeta(selectedStatus)
  const statusOptions = VEHICLE_STATUSES.map((status) => ({
    value: status,
    label: getVehicleStatusMeta(status).label,
  }))

  return (
    <Modal title={title} error={errorMessage} onClose={onClose}>
      <form
        className="scrollbar-styled mt-4 max-h-[75vh] space-y-3 overflow-y-auto overflow-x-hidden pr-1"
        onSubmit={handleSubmit(onFormSubmit)}
      >
        <Input
          label="VIN"
          error={errors.vin?.message}
          required
          autoFocus
          {...register('vin', {
            validate: (value) =>
              isValidVin(value.trim().toUpperCase()) || 'Invalid VIN format.',
          })}
        />
        <Input label="Plate number" error={errors.plate_number?.message} {...register('plate_number')} />
        <Input
          label="Brand"
          error={errors.brand?.message}
          required
          {...register('brand', {
            validate: (value) => value.trim() !== '' || 'Brand is required.',
          })}
        />
        <Input
          label="Model"
          error={errors.model?.message}
          required
          {...register('model', {
            validate: (value) => value.trim() !== '' || 'Model is required.',
          })}
        />
        <Input
          label="Production year"
          type="number"
          error={errors.production_year?.message}
          required
          {...register('production_year', {
            valueAsNumber: true,
            validate: (value) =>
              (Number.isInteger(value) && value >= 1900 && value <= 2100) ||
              'Production year must be between 1900 and 2100.',
          })}
        />
        <Select
          label="Status"
          value={selectedStatus}
          options={statusOptions}
          onChange={(event) => setSelectedStatus(event.target.value)}
        />
        <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Selected status</p>
          <div className="mt-1 flex items-center gap-2">
            <span className={statusMeta.colorClass}>
              <statusMeta.Icon className="size-4 shrink-0" aria-hidden="true" />
            </span>
            <p className="text-sm font-medium text-gray-900">{statusMeta.label}</p>
          </div>
          <p className="mt-1 text-xs text-gray-600">{statusMeta.description}</p>
        </div>
        <Input
          label="Capacity (kg)"
          type="number"
          error={errors.capacity_kg?.message}
          {...register('capacity_kg', {
            validate: (value) =>
              value.trim() === '' ||
              (Number.isInteger(Number(value)) && Number(value) >= 0) ||
              'Capacity must be a non-negative integer.',
          })}
        />
        <Input
          label="Mileage (km)"
          type="number"
          error={errors.current_mileage_km?.message}
          required
          {...register('current_mileage_km', {
            valueAsNumber: true,
            validate: (value) =>
              (Number.isFinite(value) && value >= 0) || 'Mileage must be a non-negative number.',
          })}
        />
        <ModalFooter
          onCancel={onClose}
          submitLabel={submitLabel}
          isSubmitting={isSubmitting}
        />
      </form>
    </Modal>
  )
}

