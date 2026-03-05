import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormField } from '@/components/ui/FormField'
import { Modal } from '@/components/ui/Modal'
import { ModalFooter } from '@/components/ui/ModalFooter'
import { ClientAutocompleteInput } from '@/components/clients/ClientAutocompleteInput'
import { INPUT_CLASS } from '@/constants/inputStyles'
import { orderFormSchema, type OrderFormValues } from '@/schemas/orders'
import type { Client } from '@/hooks/clients/useClients'

export type OrderFormPayload = {
  clientId: number
  orderNumber: string
  deliveryDeadline?: string
  totalPricePln?: number
}

export type OrderFormModalProps = {
  title: string
  submitLabel: string
  onClose: () => void
  onSubmit: (payload: OrderFormPayload) => void
  isSubmitting: boolean
  errorMessage: string | null
}

export function OrderFormModal({
  title,
  submitLabel,
  onClose,
  onSubmit,
  isSubmitting,
  errorMessage,
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

  const handleClientSelect = useCallback((client: Client | null) => {
    setSelectedClient(client)
    setClientError(null)
  }, [])

  const onFormSubmit = (data: OrderFormValues) => {
    if (!selectedClient) {
      setClientError('Client is required')
      return
    }
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
    onSubmit(payload)
  }

  return (
    <Modal title={title} error={errorMessage}>
      <form className="mt-4 space-y-3" onSubmit={handleSubmit(onFormSubmit)}>
        <FormField label="Client" required error={clientError ?? undefined}>
          <ClientAutocompleteInput
            label=""
            value={selectedClient}
            onSelect={handleClientSelect}
            required
            canAddClient
          />
        </FormField>
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
        <ModalFooter
          onCancel={onClose}
          submitLabel={submitLabel}
          isSubmitting={isSubmitting}
        />
      </form>
    </Modal>
  )
}
