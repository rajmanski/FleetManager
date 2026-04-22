import { render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { OrderPlanningClientOrderSection } from './OrderPlanningClientOrderSection'
import type { OrderPlanningFormValues } from '@/schemas/orderPlanning'

vi.mock('@/components/clients/ClientAutocompleteInput', () => ({
  ClientAutocompleteInput: ({ label }: { label: string }) => <div>{label}</div>,
}))

function renderSection() {
  function Wrapper() {
    const { control, register } = useForm<OrderPlanningFormValues>()
    return (
      <OrderPlanningClientOrderSection
        control={control}
        register={register}
        errors={{}}
        selectedClient={null}
        onClientChange={vi.fn()}
      />
    )
  }
  render(<Wrapper />)
}

describe('OrderPlanningClientOrderSection', () => {
  it('renders key client/order form fields', () => {
    renderSection()
    expect(screen.getByText('Client')).toBeInTheDocument()
    expect(screen.getByText('Order number')).toBeInTheDocument()
    expect(screen.getByText('Delivery deadline')).toBeInTheDocument()
    expect(screen.getByText('Total price (PLN)')).toBeInTheDocument()
    expect(document.querySelector('input[name="orderNumber"]')).not.toBeNull()
    expect(document.querySelector('input[name="deliveryDeadline"]')).not.toBeNull()
    expect(document.querySelector('input[name="totalPricePln"]')).not.toBeNull()
  })
})
