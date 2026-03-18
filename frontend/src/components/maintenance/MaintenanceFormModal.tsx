import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/Modal'
import { ModalFooter } from '@/components/ui/ModalFooter'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import {
  maintenanceFormSchema,
  type MaintenanceFormInput,
  type MaintenanceFormValues,
} from '@/schemas/maintenance'

export type MaintenanceFormModalProps = {
  title: string
  submitLabel: string
  vehicleOptions: ReadonlyArray<{ value: string; label: string }>
  onClose: () => void
  onSubmit: (values: MaintenanceFormValues) => void
  isSubmitting: boolean
  errorMessage: string | null
}

const maintenanceTypeOptions = [
  { value: 'Routine', label: 'Inspection (Routine)' },
  { value: 'Repair', label: 'Repair' },
  { value: 'TireChange', label: 'Tire change' },
] as const

export function MaintenanceFormModal({
  title,
  submitLabel,
  vehicleOptions,
  onClose,
  onSubmit,
  isSubmitting,
  errorMessage,
}: MaintenanceFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MaintenanceFormInput>({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues: {
      vehicleId: vehicleOptions[0]?.value ?? '',
      type: 'Routine',
      scheduledDate: new Date().toISOString().slice(0, 10),
      description: '',
      partsCostPln: 0,
      laborCostPln: 0,
    },
  })

  return (
    <Modal title={title} error={errorMessage} contentClassName="max-w-lg">
      <form
        className="mt-4 space-y-4"
        onSubmit={handleSubmit((values) => onSubmit(maintenanceFormSchema.parse(values)))}
      >
        <Select
          label="Vehicle"
          error={errors.vehicleId?.message}
          required
          options={vehicleOptions}
          {...register('vehicleId')}
        />

        <Select
          label="Type"
          error={errors.type?.message}
          required
          options={maintenanceTypeOptions}
          {...register('type')}
        />

        <Input
          label="Scheduled date"
          type="date"
          error={errors.scheduledDate?.message}
          required
          {...register('scheduledDate')}
        />

        <Textarea
          label="Description"
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Parts cost (PLN)"
            type="number"
            variant="numericDecimal"
            error={errors.partsCostPln?.message}
            step="0.01"
            min={0}
            {...register('partsCostPln')}
          />
          <Input
            label="Labor cost (PLN)"
            type="number"
            variant="numericDecimal"
            error={errors.laborCostPln?.message}
            step="0.01"
            min={0}
            {...register('laborCostPln')}
          />
        </div>

        <ModalFooter
          onCancel={onClose}
          submitLabel={submitLabel}
          isSubmitting={isSubmitting}
        />
      </form>
    </Modal>
  )
}

