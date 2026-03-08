import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { ModalFooter } from '@/components/ui/ModalFooter'
import { clientFormSchema, type ClientFormValues } from '@/schemas/clients'
import { formatNipDisplay, normalizeNipDigits } from '@/utils/nip'

export type { ClientFormValues }

export type ClientFormModalProps = {
  title: string
  submitLabel: string
  initialData?: ClientFormValues
  onClose: () => void
  onSubmit: (values: ClientFormValues) => void
  isSubmitting: boolean
  errorMessage: string | null
}

export function ClientFormModal({
  title,
  submitLabel,
  initialData,
  onClose,
  onSubmit,
  isSubmitting,
  errorMessage,
}: ClientFormModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      companyName: initialData?.companyName ?? '',
      nip: formatNipDisplay(initialData?.nip ?? ''),
      address: initialData?.address ?? '',
      contactEmail: initialData?.contactEmail ?? '',
    },
  })

  const nipValue = watch('nip')

  useEffect(() => {
    const formatted = formatNipDisplay(nipValue)
    if (formatted !== nipValue) {
      setValue('nip', formatted, { shouldValidate: false, shouldDirty: true })
    }
  }, [nipValue, setValue])

  const onFormSubmit = (values: ClientFormValues) => {
    onSubmit({
      companyName: values.companyName.trim(),
      nip: normalizeNipDigits(values.nip),
      address: values.address.trim(),
      contactEmail: values.contactEmail.trim(),
    })
  }

  return (
    <Modal title={title} error={errorMessage}>
      <form className="mt-4 space-y-4" onSubmit={handleSubmit(onFormSubmit)}>
        <Input
          label="Company name"
          error={errors.companyName?.message}
          required
          {...register('companyName')}
        />

        <Input
          label="NIP"
          error={errors.nip?.message}
          required
          inputMode="numeric"
          placeholder="XXX-XXX-XX-XX"
          {...register('nip')}
        />

        <Textarea
          label="Address"
          error={errors.address?.message}
          {...register('address')}
        />

        <Input
          label="Contact email"
          type="email"
          error={errors.contactEmail?.message}
          {...register('contactEmail')}
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

