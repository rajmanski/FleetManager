import { useForm } from 'react-hook-form'
import { FormField } from '@/components/ui/FormField'
import { FormErrorMessage } from '@/components/ui/FormErrorMessage'
import { Modal } from '@/components/ui/Modal'
import { ModalFooter } from '@/components/ui/ModalFooter'
import type { VehicleMutationPayload } from '@/hooks/vehicles/useVehicles'
import { INPUT_CLASS } from '@/constants/inputStyles'
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
    }
    if (status !== undefined) {
      payload.status = status
    }
    onSubmit(payload)
  }

  return (
    <Modal title={title}>
      <form className="mt-4 space-y-3" onSubmit={handleSubmit(onFormSubmit)}>
        <FormField label="VIN" error={errors.vin?.message}>
          <input
            type="text"
            {...register('vin', {
              validate: (value) =>
                isValidVin(value.trim().toUpperCase()) || 'Invalid VIN format or checksum.',
            })}
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField label="Plate number" error={errors.plate_number?.message}>
          <input {...register('plate_number')} className={INPUT_CLASS} />
        </FormField>
        <FormField label="Brand" error={errors.brand?.message}>
          <input
            {...register('brand', {
              validate: (value) => value.trim() !== '' || 'Brand is required.',
            })}
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField label="Model" error={errors.model?.message}>
          <input
            {...register('model', {
              validate: (value) => value.trim() !== '' || 'Model is required.',
            })}
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField label="Production year" error={errors.production_year?.message}>
          <input
            type="number"
            {...register('production_year', {
              valueAsNumber: true,
              validate: (value) =>
                (Number.isInteger(value) && value >= 1900 && value <= 2100) ||
                'Production year must be between 1900 and 2100.',
            })}
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField label="Capacity (kg)" error={errors.capacity_kg?.message}>
          <input
            type="number"
            {...register('capacity_kg', {
              validate: (value) =>
                value.trim() === '' ||
                (Number.isInteger(Number(value)) && Number(value) >= 0) ||
                'Capacity must be a non-negative integer.',
            })}
            className={INPUT_CLASS}
          />
        </FormField>
        <FormField label="Mileage (km)" error={errors.current_mileage_km?.message}>
          <input
            type="number"
            {...register('current_mileage_km', {
              valueAsNumber: true,
              validate: (value) =>
                (Number.isFinite(value) && value >= 0) || 'Mileage must be a non-negative number.',
            })}
            className={INPUT_CLASS}
          />
        </FormField>
        <FormErrorMessage message={errorMessage} />
        <ModalFooter
          onCancel={onClose}
          submitLabel={submitLabel}
          isSubmitting={isSubmitting}
        />
      </form>
    </Modal>
  )
}
