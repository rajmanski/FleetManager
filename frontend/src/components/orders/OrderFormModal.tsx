import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormField } from '@/components/ui/FormField'
import { Modal } from '@/components/ui/Modal'
import { ModalFooter } from '@/components/ui/ModalFooter'
import { ClientAutocompleteInput } from '@/components/clients/ClientAutocompleteInput'
import { CargoSection } from '@/components/orders/CargoSection'
import { INPUT_CLASS } from '@/constants/inputStyles'
import { type CargoItemDraft, type CargoPayload } from '@/schemas/cargo'
import { orderFormSchema, type OrderFormValues } from '@/schemas/orders'
import { parseCargoDraftsToPayloads, type CargoItemErrors } from '@/utils/cargo'
import type { Client } from '@/hooks/clients/useClients'

export type OrderFormPayload = {
  clientId: number
  orderNumber: string
  deliveryDeadline?: string
  totalPricePln?: number
  cargoItems?: CargoPayload[]
}

export type OrderFormModalProps = {
  title: string
  submitLabel: string
  onClose: () => void
  onSubmit: (payload: OrderFormPayload) => void
  isSubmitting: boolean
  errorMessage: string | null
  waypoints?: { id: number; address: string; actionType: string }[]
}

export function OrderFormModal({
  title,
  submitLabel,
  onClose,
  onSubmit,
  isSubmitting,
  errorMessage,
  waypoints = [],
}: OrderFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      orderNumber: '',
      deliveryDeadline: '',
      totalPricePln: '',
    },
  })

  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientError, setClientError] = useState<string | null>(null)
  const [cargoItems, setCargoItems] = useState<CargoItemDraft[]>([])
  const [cargoErrors, setCargoErrors] = useState<
    Record<string, CargoItemErrors>
  >({})

  const handleClientSelect = useCallback((client: Client | null) => {
    setSelectedClient(client)
    setClientError(null)
  }, [])

  const onFormSubmit = (data: OrderFormValues) => {
    if (!selectedClient) {
      setClientError('Client is required')
      return
    }

    const { payloads: cargoPayloads, errors: cargoErr } =
      parseCargoDraftsToPayloads(cargoItems)
    if (Object.keys(cargoErr).length > 0) {
      setCargoErrors(cargoErr)
      return
    }
    setCargoErrors({})

    const payload: OrderFormPayload = {
      clientId: selectedClient.id,
      orderNumber: data.orderNumber.trim(),
    }
    if (data.deliveryDeadline?.trim()) {
      payload.deliveryDeadline = data.deliveryDeadline.trim()
    }
    const price = data.totalPricePln?.trim()
    if (price && Number.isFinite(parseFloat(price))) {
      payload.totalPricePln = parseFloat(price)
    }
    if (cargoPayloads.length > 0) {
      payload.cargoItems = cargoPayloads
    }
    onSubmit(payload)
  }

  return (
    <Modal title={title} contentClassName="max-w-4xl" error={errorMessage}>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <div className="scrollbar-styled mt-4 max-h-[min(70vh,600px)] overflow-y-auto pr-1">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <ClientAutocompleteInput
                  label="Client"
                  value={selectedClient}
                  onSelect={handleClientSelect}
                  required
                  canAddClient
                  error={clientError ?? undefined}
                />
              </div>
              <FormField label="Order number" error={errors.orderNumber?.message} required>
                <input
                  type="text"
                  {...register('orderNumber')}
                  placeholder="e.g. ORD-2026-001"
                  className={INPUT_CLASS}
                />
              </FormField>
              <FormField label="Delivery deadline" error={errors.deliveryDeadline?.message}>
                <input type="date" {...register('deliveryDeadline')} className={INPUT_CLASS} />
              </FormField>
              <FormField label="Total price (PLN)" error={errors.totalPricePln?.message}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('totalPricePln')}
                  placeholder="0.00"
                  className={INPUT_CLASS}
                />
              </FormField>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <CargoSection
                items={cargoItems}
                onChange={setCargoItems}
                waypoints={waypoints}
                itemErrors={cargoErrors}
              />
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
