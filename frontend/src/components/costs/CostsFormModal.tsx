import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ModalFooter } from '@/components/ui/ModalFooter'
import { Select } from '@/components/ui/Select'
import { costsFormSchema, type CostsFormInput, type CostsFormValues } from '@/schemas/costs'

export type CostsFormModalProps = {
  title: string
  submitLabel: string
  vehicleOptions: ReadonlyArray<{ value: string; label: string }>
  onClose: () => void
  onSubmit: (values: CostsFormValues) => void
  isSubmitting: boolean
  errorMessage: string | null
}

const categoryOptions = [
  { value: 'Tolls', label: 'Tolls' },
  { value: 'Other', label: 'Other' },
] as const

export function CostsFormModal({
  title,
  submitLabel,
  vehicleOptions,
  onClose,
  onSubmit,
  isSubmitting,
  errorMessage,
}: CostsFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CostsFormInput>({
    resolver: zodResolver(costsFormSchema),
    defaultValues: {
      vehicleId: vehicleOptions[0]?.value ?? '',
      category: 'Tolls',
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      description: '',
      invoiceNumber: '',
    },
  })

  return (
    <Modal title={title} error={errorMessage} contentClassName="max-w-lg">
      <form className="mt-4 space-y-4" onSubmit={handleSubmit((v) => onSubmit(costsFormSchema.parse(v)))}>
        <Select
          label="Vehicle"
          error={errors.vehicleId?.message}
          required
          options={vehicleOptions}
          {...register('vehicleId')}
        />

        <Select
          label="Category"
          error={errors.category?.message}
          required
          options={categoryOptions}
          {...register('category')}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Amount (PLN)"
            type="number"
            variant="numericDecimal"
            error={errors.amount?.message}
            step="0.01"
            min={0}
            required
            {...register('amount')}
          />
          <Input
            label="Date"
            type="date"
            error={errors.date?.message}
            required
            {...register('date')}
          />
        </div>

        <Input label="Description" error={errors.description?.message} {...register('description')} />
        <Input label="Invoice number" error={errors.invoiceNumber?.message} {...register('invoiceNumber')} />

        <ModalFooter onCancel={onClose} submitLabel={submitLabel} isSubmitting={isSubmitting} />
      </form>
    </Modal>
  )
}

