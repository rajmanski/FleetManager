import { render, screen } from '@testing-library/react'
import { OrderPlanningSummarySection } from './OrderPlanningSummarySection'

describe('OrderPlanningSummarySection', () => {
  it('renders summary values for planned order', () => {
    render(
      <OrderPlanningSummarySection
        selectedClient={{
          id: 7,
          companyName: 'ACME Logistics',
          nip: '1234567890',
          address: 'Warszawa',
          contactEmail: 'ops@acme.test',
          deletedAt: undefined,
        }}
        orderNumber="ORD-2026-100"
        cargoLineCount={2}
        totalWeightKg={1300.4}
        routeResult={{ distance_km: 512.2, duration_minutes: 450, polyline: 'abc' }}
      />,
    )

    expect(screen.getByText('ACME Logistics')).toBeInTheDocument()
    expect(screen.getByText('ORD-2026-100')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('1300.4 kg')).toBeInTheDocument()
    expect(screen.getByText('512.2 km')).toBeInTheDocument()
    expect(screen.getByText('450 min')).toBeInTheDocument()
  })
})
