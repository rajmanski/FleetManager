import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/Modal'
import { ModalFooter } from '@/components/ui/ModalFooter'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import {
  insuranceFormSchema,
  type InsuranceFormInput,
  type InsuranceFormValues,
} from '@/schemas/insurance'

export type InsuranceFormModalProps = {
  title: string
  submitLabel: string
  vehicleOptions: ReadonlyArray<{ value: string; label: string }>
  onClose: () => void
  onSubmit: (values: InsuranceFormValues) => void
  isSubmitting: boolean
  errorMessage: string | null
}

const policyTypeOptions = [
  { value: 'OC', label: 'OC' },
  { value: 'AC', label: 'AC' },
] as const

function defaultEndDateOneYearFromToday(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}

export function InsuranceFormModal({
  title,
  submitLabel,
  vehicleOptions,
  onClose,
  onSubmit,
  isSubmitting,
  errorMessage,
}: InsuranceFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InsuranceFormInput>({
    resolver: zodResolver(insuranceFormSchema),
    defaultValues: {
      vehicleId: vehicleOptions[0]?.value ?? '',
      type: 'OC',
      policyNumber: '',
      insurer: '',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: defaultEndDateOneYearFromToday(),
      cost: 0,
    },
  })

  return (
    <Modal title={title} error={errorMessage} contentClassName="max-w-lg">
      <form
        className="mt-4 space-y-4"
        onSubmit={handleSubmit((v) => onSubmit(v as InsuranceFormValues))}
      >
        <Select
          label="Vehicle"
          error={errors.vehicleId?.message}
          required
          options={vehicleOptions}
          {...register('vehicleId')}
        />

        <Select
          label="Policy type"
          error={errors.type?.message}
          required
          options={policyTypeOptions}
          {...register('type')}
        />

        <Input
          label="Policy number"
          error={errors.policyNumber?.message}
          required
          {...register('policyNumber')}
        />

        <Input label="Insurer" error={errors.insurer?.message} required {...register('insurer')} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Start date"
            type="date"
            error={errors.startDate?.message}
            required
            {...register('startDate')}
          />
          <Input
            label="End date"
            type="date"
            error={errors.endDate?.message}
            required
            {...register('endDate')}
          />
        </div>

        <Input
          label="Cost (PLN)"
          type="number"
          variant="numericDecimal"
          error={errors.cost?.message}
          step="0.01"
          min={0}
          required
          {...register('cost')}
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
