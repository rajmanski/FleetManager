import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { FormField } from '@/components/ui/FormField'
import { Modal } from '@/components/ui/Modal'
import { ModalFooter } from '@/components/ui/ModalFooter'
import { INPUT_CLASS } from '@/constants/inputStyles'

export type ClientFormValues = {
  companyName: string
  nip: string
  address: string
  contactEmail: string
}

export type ClientFormModalProps = {
  title: string
  submitLabel: string
  initialData?: ClientFormValues
  onClose: () => void
  onSubmit: (values: ClientFormValues) => void
  isSubmitting: boolean
  errorMessage: string | null
}

function normalizeNipDigits(value: string) {
  return value.replace(/\D/g, '').slice(0, 10)
}

function formatNipDisplay(digits: string) {
  const d = normalizeNipDigits(digits)
  const parts = []
  if (d.length <= 3) {
    parts.push(d)
  } else if (d.length <= 6) {
    parts.push(d.slice(0, 3), d.slice(3))
  } else if (d.length <= 8) {
    parts.push(d.slice(0, 3), d.slice(3, 6), d.slice(6))
  } else {
    parts.push(d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8))
  }
  return parts.join('-')
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
    const digitsOnly = normalizeNipDigits(values.nip)
    onSubmit({
      companyName: values.companyName.trim(),
      nip: digitsOnly,
      address: values.address.trim(),
      contactEmail: values.contactEmail.trim(),
    })
  }

  return (
    <Modal title={title} error={errorMessage}>
      <form className="mt-4 space-y-4" onSubmit={handleSubmit(onFormSubmit)}>
        <FormField label="Company name" error={errors.companyName?.message} required>
          <input
            type="text"
            {...register('companyName', {
              validate: (value) => value.trim().length >= 3 || 'Company name must be at least 3 characters.',
            })}
            className={INPUT_CLASS}
          />
        </FormField>

        <FormField label="NIP" error={errors.nip?.message} required>
          <input
            type="text"
            inputMode="numeric"
            {...register('nip', {
              validate: (value) => {
                const digits = normalizeNipDigits(value)
                if (digits.length !== 10) {
                  return 'NIP must contain exactly 10 digits.'
                }
                if (!/^\d{10}$/.test(digits)) {
                  return 'NIP must contain only digits.'
                }
                return true
              },
            })}
            className={INPUT_CLASS}
            placeholder="XXX-XXX-XX-XX"
          />
        </FormField>

        <FormField label="Address" error={errors.address?.message}>
          <textarea
            rows={3}
            {...register('address')}
            className={INPUT_CLASS}
          />
        </FormField>

        <FormField label="Contact email" error={errors.contactEmail?.message}>
          <input
            type="email"
            {...register('contactEmail', {
              validate: (value) => {
                const trimmed = value.trim()
                if (trimmed === '') return true
                const hasAt = trimmed.includes('@')
                return hasAt || 'Invalid email format.'
              },
            })}
            className={INPUT_CLASS}
          />
        </FormField>

        <ModalFooter
          onCancel={onClose}
          submitLabel={submitLabel}
          isSubmitting={isSubmitting}
        />
      </form>
    </Modal>
  )
}

