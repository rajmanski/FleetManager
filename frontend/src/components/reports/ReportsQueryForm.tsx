import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, type SelectOption } from '@/components/ui/Select'
import {
  reportsFormSchema,
  type ReportsFormValues,
  REPORT_TYPES,
  type ReportType,
} from '@/schemas/reports'

const REPORT_TYPE_OPTIONS: { value: ReportType; label: string }[] = [
  { value: REPORT_TYPES[0], label: 'Vehicle profitability' },
  { value: REPORT_TYPES[1], label: 'Driver mileage' },
  { value: REPORT_TYPES[2], label: 'Global cost report' },
]

type ReportsQueryFormProps = {
  formValues: ReportsFormValues
  vehicleOptions: SelectOption[]
  driverOptions: SelectOption[]
  vehiclesLoading: boolean
  driversLoading: boolean
  onApply: (values: ReportsFormValues) => void
}

export function ReportsQueryForm({
  formValues,
  vehicleOptions,
  driverOptions,
  vehiclesLoading,
  driversLoading,
  onApply,
}: ReportsQueryFormProps) {
  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReportsFormValues>({
    resolver: zodResolver(reportsFormSchema),
    values: formValues,
  })

  const reportType = watch('reportType')

  return (
    <form
      onSubmit={handleSubmit(onApply)}
      className="max-w-xl space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      noValidate
    >
      <Controller
        name="reportType"
        control={control}
        render={({ field }) => (
          <Select
            label="Report type"
            required
            options={REPORT_TYPE_OPTIONS}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            name={field.name}
            ref={field.ref}
            error={errors.reportType?.message}
          />
        )}
      />

      {reportType === 'vehicle-profitability' && (
        <div className="space-y-4">
          <Controller
            name="vehicleId"
            control={control}
            render={({ field }) => (
              <Select
                label="Vehicle"
                required
                allowEmpty
                emptyLabel="— Select vehicle"
                options={vehicleOptions}
                disabled={vehiclesLoading}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
                error={errors.vehicleId?.message}
              />
            )}
          />
          <Input
            label="Month"
            type="month"
            required
            error={errors.month?.message}
            {...register('month')}
          />
        </div>
      )}

      {reportType === 'driver-mileage' && (
        <div className="space-y-4">
          <Controller
            name="driverId"
            control={control}
            render={({ field }) => (
              <Select
                label="Driver"
                required
                allowEmpty
                emptyLabel="— Select driver"
                options={driverOptions}
                disabled={driversLoading}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
                error={errors.driverId?.message}
              />
            )}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Date from"
              type="date"
              required
              error={errors.dateFrom?.message}
              {...register('dateFrom')}
            />
            <Input
              label="Date to"
              type="date"
              required
              error={errors.dateTo?.message}
              {...register('dateTo')}
            />
          </div>
        </div>
      )}

      {reportType === 'global-costs' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Date from"
            type="date"
            required
            error={errors.dateFrom?.message}
            {...register('dateFrom')}
          />
          <Input
            label="Date to"
            type="date"
            required
            error={errors.dateTo?.message}
            {...register('dateTo')}
          />
        </div>
      )}

      <div className="flex justify-end border-t border-gray-100 pt-4">
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          Apply
        </Button>
      </div>
    </form>
  )
}
