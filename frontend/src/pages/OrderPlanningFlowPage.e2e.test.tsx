import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import OrderPlanningFlowPage from './OrderPlanningFlowPage'
let mockPending = false

vi.mock('@/components/orders-planning/OrderPlanningClientOrderSection', () => ({
  OrderPlanningClientOrderSection: () => <div>Client and order section</div>,
}))
vi.mock('@/components/orders-planning/OrderPlanningCargoSection', () => ({
  OrderPlanningCargoSection: () => <div>Cargo section</div>,
}))
vi.mock('@/components/orders-planning/OrderPlanningRouteSection', () => ({
  OrderPlanningRouteSection: () => <div>Route section</div>,
}))
vi.mock('@/components/orders-planning/OrderPlanningResourcesSection', () => ({
  OrderPlanningResourcesSection: () => <div>Resources section</div>,
}))
vi.mock('@/components/orders-planning/OrderPlanningSummarySection', () => ({
  OrderPlanningSummarySection: () => <div>Summary</div>,
}))

vi.mock('@/hooks/orders/useOrderPlanningFlow', () => {
  const steps = [
    { id: 'client_order', title: 'Client and order' },
    { id: 'cargo', title: 'Cargo' },
    { id: 'route', title: 'Route' },
    { id: 'resources', title: 'Resources' },
    { id: 'summary', title: 'Summary' },
  ] as const

  return {
    useOrderPlanningFlow: () => {
      const [activeStepIndex, setActiveStepIndex] = React.useState(0)
      const activeStep = steps[activeStepIndex]
      return {
        register: () => ({}),
        handleSubmit: (_onSubmit: () => void) => (event: React.FormEvent) => {
          event.preventDefault()
        },
        control: {},
        watch: (name: string) => (name === 'orderNumber' ? 'ORD-E2E-001' : ''),
        errors: {},
        selectedClient: { id: 1, companyName: 'Client E2E', nip: '1234567890' },
        setSelectedClient: vi.fn(),
        routePlanning: {
          origin: { address: 'Warszawa', lat: 52.2297, lng: 21.0122 },
          setOrigin: vi.fn(),
          destination: { address: 'Krakow', lat: 50.0647, lng: 19.9450 },
          setDestination: vi.fn(),
          waypoints: [],
          setWaypoints: vi.fn(),
          points: [],
          polyline: null,
          result: { distance_km: 300, duration_minutes: 240, polyline: 'abc' },
          isCalculating: false,
          error: null,
          calculateRoute: vi.fn(async () => {}),
          handleMapClick: vi.fn(async () => {}),
          showMap: false,
        },
        steps,
        activeStep,
        activeStepIndex,
        goToStep: (index: number) => setActiveStepIndex(index),
        nextStep: async () => setActiveStepIndex((prev) => Math.min(prev + 1, steps.length - 1)),
        prevStep: () => setActiveStepIndex((prev) => Math.max(prev - 1, 0)),
        vehicleOptions: [{ value: '5', label: 'Vehicle 5' }],
        driverOptions: [{ value: '12', label: 'Driver 12' }],
        waypointDropoffOptions: [],
        cargoWatch: [{ id: 'c-1' }],
        setCargoItems: vi.fn(),
        cargoItemErrors: {},
        mutation: { isPending: mockPending, error: null },
        submissionState: 'idle',
        backendSectionErrors: {
          client_order: [],
          cargo: [],
          route: [],
          resources: [],
          summary: [],
        },
        flowErrors: [],
        canSubmit: activeStep.id === 'summary' && !mockPending,
        totalWeightKg: 1000,
        vehicleAvailabilityPending: false,
      }
    },
  }
})

describe('OrderPlanningFlowPage e2e', () => {
  beforeEach(() => {
    mockPending = false
  })

  it('completes integrated planning flow and submits', async () => {
    const user = userEvent.setup()
    render(<OrderPlanningFlowPage />)

    await user.click(screen.getByRole('button', { name: /Next step/i }))
    await user.click(screen.getByRole('button', { name: /Next step/i }))
    await user.click(screen.getByRole('button', { name: /Next step/i }))
    await user.click(screen.getByRole('button', { name: /Next step/i }))

    expect(screen.getByText('Summary')).toBeInTheDocument()

    const submitButton = screen.getByRole('button', { name: /Create planned order/i })
    expect(submitButton).toBeEnabled()
  })

  it('keeps submit disabled while mutation is pending', async () => {
    mockPending = true
    const user = userEvent.setup()
    render(<OrderPlanningFlowPage />)

    await user.click(screen.getByRole('button', { name: /Next step/i }))
    await user.click(screen.getByRole('button', { name: /Next step/i }))
    await user.click(screen.getByRole('button', { name: /Next step/i }))
    await user.click(screen.getByRole('button', { name: /Next step/i }))

    expect(screen.getByRole('button', { name: /Saving…/i })).toBeDisabled()
  })
})
