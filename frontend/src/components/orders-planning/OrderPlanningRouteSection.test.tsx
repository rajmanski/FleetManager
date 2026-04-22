import { render, screen } from '@testing-library/react'
import { OrderPlanningRouteSection } from './OrderPlanningRouteSection'

vi.mock('@/components/routes/RoutePlanningForm', () => ({
  RoutePlanningForm: () => <div>RoutePlanningFormStub</div>,
}))

vi.mock('@/components/routes/RouteMap', () => ({
  RouteMap: () => <div>RouteMapStub</div>,
}))

describe('OrderPlanningRouteSection', () => {
  it('renders placeholder when map should be hidden', () => {
    render(
      <OrderPlanningRouteSection
        origin={{ address: '', lat: undefined, lng: undefined }}
        setOrigin={vi.fn()}
        destination={{ address: '', lat: undefined, lng: undefined }}
        setDestination={vi.fn()}
        waypoints={[]}
        setWaypoints={vi.fn()}
        points={[]}
        polyline={undefined}
        result={null}
        isCalculating={false}
        error={null}
        calculateRoute={vi.fn(async () => {})}
        handleMapClick={vi.fn(async () => {})}
        showMap={false}
      />,
    )

    expect(screen.getByText('RoutePlanningFormStub')).toBeInTheDocument()
    expect(
      screen.getByText(/Enter load and drop-off addresses, optionally add waypoints/i),
    ).toBeInTheDocument()
  })
})
