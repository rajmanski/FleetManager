import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Checkbox } from '@/components/ui/Checkbox'
import { Modal } from '@/components/ui/Modal'
import { ModalFooter } from '@/components/ui/ModalFooter'
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
        <div className="scrollbar-styled mt-4 max-h-[min(70vh,500px)] overflow-y-auto overflow-x-hidden pr-1">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
              <Input
                label="First name"
                error={errors.first_name?.message}
                required
                {...register('first_name')}
              />
              <Input
                label="Last name"
                error={errors.last_name?.message}
                required
                {...register('last_name')}
              />
              <Input
                label="PESEL"
                error={errors.pesel?.message}
                required
                placeholder="11 digits"
                {...register('pesel')}
              />
              <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
              <Input
                label="Email"
                type="email"
                error={errors.email?.message}
                {...register('email')}
              />
              <Select
                label="Status"
                error={errors.status?.message}
                required
                options={DRIVER_STATUS_OPTIONS}
                {...register('status')}
              />
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="mb-3 text-sm font-medium text-gray-700">Certificates</h3>
              <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                <Input
                  label="License number"
                  error={errors.license_number?.message}
                  placeholder="e.g. ABC123456"
                  {...register('license_number')}
                />
                <div>
                  <Input
                    label="License expiry date"
                    type="date"
                    error={errors.license_expiry_date?.message}
                    {...register('license_expiry_date')}
                  />
                  {isDateExpired(licenseExpiryDate) && (
                    <p className="mt-1 text-sm text-amber-600">Certificate expired</p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <Controller
                    name="adr_certified"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        label="ADR certificate"
                        description="Has ADR certificate"
                        checked={field.value ?? false}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        ref={field.ref}
                      />
                    )}
                  />
                </div>
                <div>
                  <Input
                    label="ADR expiry date"
                    type="date"
                    error={errors.adr_expiry_date?.message}
                    disabled={!adrCertified}
                    {...register('adr_expiry_date')}
                  />
                  {adrCertified && isDateExpired(adrExpiryDate) && (
                    <p className="mt-1 text-sm text-amber-600">Certificate expired</p>
                  )}
                </div>
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
