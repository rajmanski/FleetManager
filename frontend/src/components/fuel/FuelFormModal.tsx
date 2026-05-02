import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/Modal'
import { ModalFooter } from '@/components/ui/ModalFooter'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { fuelFormSchema, type FuelFormInput, type FuelFormValues } from '@/schemas/fuel'

type VehicleOption = {
  value: string
  label: string
  currentMileageKm: number
}

export type FuelFormModalProps = {
  title: string
  submitLabel: string
  vehicleOptions: ReadonlyArray<VehicleOption>
  onClose: () => void
  onSubmit: (values: FuelFormValues) => void
  isSubmitting: boolean
  errorMessage: string | null
}

export function FuelFormModal({
  title,
  submitLabel,
  vehicleOptions,
  onClose,
  onSubmit,
  isSubmitting,
  errorMessage,
}: FuelFormModalProps) {
  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<FuelFormInput>({
    resolver: zodResolver(fuelFormSchema),
    defaultValues: {
      vehicleId: vehicleOptions[0]?.value ?? '',
      date: new Date().toISOString().slice(0, 10),
      liters: 0,
      pricePerLiter: 0,
      mileage: vehicleOptions[0]?.currentMileageKm ?? 0,
      location: '',
    },
  })

  const selectedVehicleId = watch('vehicleId')
  const liters = watch('liters')
  const pricePerLiter = watch('pricePerLiter')

  const totalCost = useMemo(() => {
    const l = Number(liters as number | string) || 0
    const p = Number(pricePerLiter as number | string) || 0
    return l * p
  }, [liters, pricePerLiter])

  useEffect(() => {
    const selected = vehicleOptions.find((v) => v.value === selectedVehicleId)
    if (selected) {
      setValue('mileage', selected.currentMileageKm, { shouldDirty: true })
    }
  }, [selectedVehicleId, vehicleOptions, setValue])

  return (
    <Modal title={title} error={errorMessage} contentClassName="max-w-lg">
      <form className="mt-4 space-y-4" onSubmit={handleSubmit((v) => onSubmit(v as FuelFormValues))}>
        <Select
          label="Vehicle"
          error={errors.vehicleId?.message}
          required
          options={vehicleOptions}
          {...register('vehicleId')}
        />

        <Input label="Date" type="date" error={errors.date?.message} required {...register('date')} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Liters"
            type="number"
            variant="numericDecimal"
            error={errors.liters?.message}
            step="0.01"
            min={0}
            required
            {...register('liters')}
          />
          <Input
            label="Price per liter (PLN)"
            type="number"
            variant="numericDecimal"
            error={errors.pricePerLiter?.message}
            step="0.01"
            min={0}
            required
            {...register('pricePerLiter')}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Mileage (km)"
            type="number"
            error={errors.mileage?.message}
            min={0}
            required
            {...register('mileage')}
          />
          <Input
            label="Location"
            error={errors.location?.message}
            {...register('location')}
          />
        </div>

        <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          <span className="font-medium text-gray-800">Total cost:</span>{' '}
          {totalCost.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
          PLN
        </div>

        <ModalFooter onCancel={onClose} submitLabel={submitLabel} isSubmitting={isSubmitting} />
      </form>
    </Modal>
  )
}
