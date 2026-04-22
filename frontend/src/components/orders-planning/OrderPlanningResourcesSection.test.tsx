import { render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { OrderPlanningResourcesSection } from './OrderPlanningResourcesSection'
import type { OrderPlanningFormValues } from '@/schemas/orderPlanning'

function renderWithForm(errors?: Partial<Record<keyof OrderPlanningFormValues, string>>) {
  function Wrapper() {
    const { register } = useForm<OrderPlanningFormValues>()
    return (
      <OrderPlanningResourcesSection
        register={register}
        errors={{
          vehicleId: errors?.vehicleId ? { message: errors.vehicleId, type: 'manual' } : undefined,
          driverId: errors?.driverId ? { message: errors.driverId, type: 'manual' } : undefined,
          startTime: errors?.startTime ? { message: errors.startTime, type: 'manual' } : undefined,
        }}
        vehicleOptions={[]}
        driverOptions={[]}
        vehicleAvailabilityPending={false}
      />
    )
  }

  render(<Wrapper />)
}

describe('OrderPlanningResourcesSection', () => {
  it('renders validation errors from form state', () => {
    renderWithForm({
      vehicleId: 'Vehicle is required',
      driverId: 'Driver is required',
      startTime: 'Trip start time is required',
    })

    expect(screen.getByText('Vehicle is required')).toBeInTheDocument()
    expect(screen.getByText('Driver is required')).toBeInTheDocument()
    expect(screen.getByText('Trip start time is required')).toBeInTheDocument()
  })

  it('shows no available vehicles message when list is empty', () => {
    renderWithForm()
    expect(
      screen.getByText(/No vehicles are available for the selected start time/i),
    ).toBeInTheDocument()
  })
})
