import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormField } from '@/components/ui/FormField'
import { Modal } from '@/components/ui/Modal'
import { ModalFooter } from '@/components/ui/ModalFooter'
import { INPUT_CLASS } from '@/constants/inputStyles'
import { DRIVER_STATUS_OPTIONS } from '@/constants/driverStatuses'
import type { DriverFormValues } from '@/schemas/drivers'
import { driverFormSchema } from '@/schemas/drivers'
import type { DriverMutationPayload } from '@/hooks/drivers/useDrivers'
import { isDateExpired } from '@/utils/date'

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
    <Modal title={title} contentClassName="max-w-xl" error={errorMessage}>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <div className="scrollbar-styled mt-4 max-h-[min(70vh,500px)] overflow-y-auto pr-1">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
              <FormField label="First name" error={errors.first_name?.message} required>
                <input {...register('first_name')} className={INPUT_CLASS} />
              </FormField>
              <FormField label="Last name" error={errors.last_name?.message} required>
                <input {...register('last_name')} className={INPUT_CLASS} />
              </FormField>
              <FormField label="PESEL" error={errors.pesel?.message} required>
                <input {...register('pesel')} className={INPUT_CLASS} placeholder="11 digits" />
              </FormField>
              <FormField label="Phone" error={errors.phone?.message}>
                <input {...register('phone')} className={INPUT_CLASS} />
              </FormField>
              <FormField label="Email" error={errors.email?.message}>
                <input type="email" {...register('email')} className={INPUT_CLASS} />
              </FormField>
              <FormField label="Status" error={errors.status?.message} required>
                <select {...register('status')} className={INPUT_CLASS}>
                  {DRIVER_STATUS_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="mb-3 text-sm font-medium text-gray-700">Certificates</h3>
              <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                <FormField label="License number" error={errors.license_number?.message}>
                  <input
                    {...register('license_number')}
                    className={INPUT_CLASS}
                    placeholder="e.g. ABC123456"
                  />
                </FormField>
                <FormField label="License expiry date" error={errors.license_expiry_date?.message}>
                  <input type="date" {...register('license_expiry_date')} className={INPUT_CLASS} />
                  {isDateExpired(licenseExpiryDate) && (
                    <p className="mt-1 text-sm text-amber-600">Certificate expired</p>
                  )}
                </FormField>
                <div className="sm:col-span-2">
                  <FormField label="ADR certificate">
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
                        <span className="text-sm">Has ADR certificate</span>
                      </label>
                    )}
                  />
                  </FormField>
                </div>
                <FormField
                  label="ADR expiry date"
                  error={errors.adr_expiry_date?.message}
                >
                  <input
                    type="date"
                    {...register('adr_expiry_date')}
                    className={INPUT_CLASS}
                    disabled={!adrCertified}
                  />
                  {adrCertified && isDateExpired(adrExpiryDate) && (
                    <p className="mt-1 text-sm text-amber-600">Certificate expired</p>
                  )}
                </FormField>
              </div>
            </div>
          </div>
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
