import { Input } from '@/components/ui/Input'
import { Select, type SelectOption } from '@/components/ui/Select'
import type { OrderPlanningFormValues } from '@/schemas/orderPlanning'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'

type OrderPlanningResourcesSectionProps = {
  register: UseFormRegister<OrderPlanningFormValues>
  errors: FieldErrors<OrderPlanningFormValues>
  vehicleOptions: SelectOption[]
  driverOptions: SelectOption[]
  vehicleAvailabilityPending: boolean
}

export function OrderPlanningResourcesSection({
  register,
  errors,
  vehicleOptions,
  driverOptions,
  vehicleAvailabilityPending,
}: OrderPlanningResourcesSectionProps) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-800">
        Driver and vehicle
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Select
          label="Vehicle"
          required
          options={vehicleOptions}
          allowEmpty
          emptyLabel="Select vehicle"
          error={errors.vehicleId?.message}
          {...register('vehicleId')}
        />
        <Select
          label="Driver"
          required
          options={driverOptions}
          allowEmpty
          emptyLabel="Select driver"
          error={errors.driverId?.message}
          {...register('driverId')}
        />
        <div className="md:col-span-2">
          <Input
            label="Trip start"
            type="datetime-local"
            required
            error={errors.startTime?.message}
            {...register('startTime')}
          />
        </div>
        <div className="md:col-span-2">
          {vehicleAvailabilityPending ? (
            <p className="text-sm text-gray-600">Checking vehicle availability...</p>
          ) : vehicleOptions.length === 0 ? (
            <p className="text-sm text-amber-700">
              No vehicles are available for the selected start time. Choose a different
              term.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
