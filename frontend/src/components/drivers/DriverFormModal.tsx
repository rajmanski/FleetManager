import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormField } from '@/components/ui/FormField'
import { FormErrorMessage } from '@/components/ui/FormErrorMessage'
import { Modal } from '@/components/ui/Modal'
import { ModalFooter } from '@/components/ui/ModalFooter'
import { INPUT_CLASS } from '@/constants/inputStyles'
import { DRIVER_STATUSES } from '@/constants/driverStatuses'
import type { DriverFormValues } from '@/schemas/drivers'
import { driverFormSchema } from '@/schemas/drivers'
import type { DriverMutationPayload } from '@/hooks/drivers/useDrivers'

export type DriverFormModalProps = {
  title: string
  submitLabel: string
  initialData?: DriverFormValues
  onClose: () => void
  onSubmit: (payload: DriverMutationPayload) => void
  isSubmitting: boolean
  errorMessage: string | null
}

export function DriverFormModal({
  title,
  submitLabel,
  initialData,
  onClose,
  onSubmit,
  isSubmitting,
  errorMessage,
}: DriverFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DriverFormValues>({
    resolver: zodResolver(driverFormSchema),
    defaultValues: {
      first_name: initialData?.first_name ?? '',
      last_name: initialData?.last_name ?? '',
      pesel: initialData?.pesel ?? '',
      phone: initialData?.phone ?? '',
      email: initialData?.email ?? '',
      status: initialData?.status ?? 'Available',
    },
  })

  const onFormSubmit = (data: DriverFormValues) => {
    const payload: DriverMutationPayload = {
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      pesel: data.pesel.trim(),
      status: data.status,
    }
    if (data.phone?.trim()) payload.phone = data.phone.trim()
    if (data.email?.trim()) payload.email = data.email.trim()
    onSubmit(payload)
  }

  return (
    <Modal title={title}>
      <form className="mt-4 space-y-3" onSubmit={handleSubmit(onFormSubmit)}>
        <FormField label="First name" error={errors.first_name?.message}>
          <input {...register('first_name')} className={INPUT_CLASS} />
        </FormField>
        <FormField label="Last name" error={errors.last_name?.message}>
          <input {...register('last_name')} className={INPUT_CLASS} />
        </FormField>
        <FormField label="PESEL" error={errors.pesel?.message}>
          <input {...register('pesel')} className={INPUT_CLASS} placeholder="11 digits" />
        </FormField>
        <FormField label="Phone" error={errors.phone?.message}>
          <input {...register('phone')} className={INPUT_CLASS} />
        </FormField>
        <FormField label="Email" error={errors.email?.message}>
          <input type="email" {...register('email')} className={INPUT_CLASS} />
        </FormField>
        <FormField label="Status" error={errors.status?.message}>
          <select {...register('status')} className={INPUT_CLASS}>
            {DRIVER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
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
