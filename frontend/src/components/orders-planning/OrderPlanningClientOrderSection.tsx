import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from 'react-hook-form'
import { ClientAutocompleteInput } from '@/components/clients/ClientAutocompleteInput'
import { Input } from '@/components/ui/Input'
import type { Client } from '@/hooks/clients/useClients'
import type { OrderPlanningFormValues } from '@/schemas/orderPlanning'

type OrderPlanningClientOrderSectionProps = {
  control: Control<OrderPlanningFormValues>
  register: UseFormRegister<OrderPlanningFormValues>
  errors: FieldErrors<OrderPlanningFormValues>
  selectedClient: Client | null
  onClientChange: (client: Client | null) => void
}

export function OrderPlanningClientOrderSection({
  control,
  register,
  errors,
  selectedClient,
  onClientChange,
}: OrderPlanningClientOrderSectionProps) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-800">
        Client and order
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="clientId"
          control={control}
          render={({ field }) => (
            <ClientAutocompleteInput
              label="Client"
              value={selectedClient}
              onSelect={(client) => {
                onClientChange(client)
                field.onChange(client?.id ?? 0)
              }}
              error={errors.clientId?.message}
              required
            />
          )}
        />
        <Input
          label="Order number"
          required
          error={errors.orderNumber?.message}
          {...register('orderNumber')}
        />
        <Input
          label="Delivery deadline"
          type="date"
          error={errors.deliveryDeadline?.message}
          {...register('deliveryDeadline')}
        />
        <Input
          label="Total price (PLN)"
          type="number"
          step="0.01"
          min={0}
          error={errors.totalPricePln?.message}
          {...register('totalPricePln')}
        />
      </div>
    </section>
  )
}
