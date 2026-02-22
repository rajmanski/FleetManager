import { Controller, useForm } from 'react-hook-form'
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

function isDateExpired(dateStr?: string): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  return !Number.isNaN(d.getTime()) && d < new Date()
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
    control,
    handleSubmit,
    watch,
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
      license_number: initialData?.license_number ?? '',
      license_expiry_date: initialData?.license_expiry_date ?? '',
      adr_certified: initialData?.adr_certified ?? false,
      adr_expiry_date: initialData?.adr_expiry_date ?? '',
    },
  })

  const adrCertified = watch('adr_certified')
  const licenseExpiryDate = watch('license_expiry_date')
  const adrExpiryDate = watch('adr_expiry_date')

  const onFormSubmit = (data: DriverFormValues) => {
    const payload: DriverMutationPayload = {
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      pesel: data.pesel.trim(),
      status: data.status,
    }
    if (data.phone?.trim()) payload.phone = data.phone.trim()
    if (data.email?.trim()) payload.email = data.email.trim()
    if (data.license_number?.trim()) payload.license_number = data.license_number.trim()
    if (data.license_expiry_date?.trim())
      payload.license_expiry_date = `${data.license_expiry_date.trim()}T00:00:00Z`
    payload.adr_certified = data.adr_certified ?? false
    if (data.adr_expiry_date?.trim())
      payload.adr_expiry_date = `${data.adr_expiry_date.trim()}T00:00:00Z`
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

        <div className="border-t border-gray-200 pt-4">
          <h3 className="mb-3 text-sm font-medium text-gray-700">Uprawnienia</h3>
          <div className="space-y-3">
            <FormField label="Numer prawa jazdy" error={errors.license_number?.message}>
              <input
                {...register('license_number')}
                className={INPUT_CLASS}
                placeholder="np. ABC123456"
              />
            </FormField>
            <FormField label="Data ważności prawa jazdy" error={errors.license_expiry_date?.message}>
              <input type="date" {...register('license_expiry_date')} className={INPUT_CLASS} />
              {isDateExpired(licenseExpiryDate) && (
                <p className="mt-1 text-sm text-amber-600">Certyfikat wygasł</p>
              )}
            </FormField>
            <FormField label="Certyfikat ADR">
              <Controller
                name="adr_certified"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={field.value ?? false}
                      onChange={(e) => field.onChange(e.target.checked)}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      className="rounded"
                    />
                    <span className="text-sm">Posiada certyfikat ADR</span>
                  </label>
                )}
              />
            </FormField>
            <FormField
              label="Data ważności ADR"
              error={errors.adr_expiry_date?.message}
            >
              <input
                type="date"
                {...register('adr_expiry_date')}
                className={INPUT_CLASS}
                disabled={!adrCertified}
              />
              {adrCertified && isDateExpired(adrExpiryDate) && (
                <p className="mt-1 text-sm text-amber-600">Certyfikat wygasł</p>
              )}
            </FormField>
          </div>
        </div>

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
