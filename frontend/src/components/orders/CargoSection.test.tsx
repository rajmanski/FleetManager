import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CargoSection } from './CargoSection'

describe('CargoSection', () => {
  it('adds and removes cargo rows', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <CargoSection
        items={[
          {
            id: 'c-1',
            description: 'Box',
            quantity: '1',
            weightPerUnitKg: '10',
            volumePerUnitM3: '1',
            cargoType: 'General',
            destinationWaypointId: null,
            destinationWaypointTempId: null,
          },
        ]}
        onChange={onChange}
        waypoints={[]}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Add cargo/i }))
    expect(onChange).toHaveBeenCalled()

    const removeButtons = screen.getAllByRole('button')
    await user.click(removeButtons[0]!)
    expect(onChange).toHaveBeenCalled()
  })

  it('updates dropoff destination by waypoint temp id', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <CargoSection
        items={[
          {
            id: 'c-1',
            description: 'Box',
            quantity: '1',
            weightPerUnitKg: '10',
            volumePerUnitM3: '1',
            cargoType: 'General',
            destinationWaypointId: null,
            destinationWaypointTempId: null,
          },
        ]}
        onChange={onChange}
        waypoints={[
          { id: 'wp-1', address: 'Drop A', actionType: 'Dropoff' },
          { id: 'wp-2', address: 'Stop B', actionType: 'Stopover' },
        ]}
      />,
    )

    const selects = screen.getAllByRole('combobox')
    const dropoffSelect = selects[selects.length - 1]
    expect(dropoffSelect).toBeDefined()
    await user.selectOptions(dropoffSelect!, 'wp-1')
    expect(onChange).toHaveBeenCalled()
    const lastCall = onChange.mock.calls.at(-1)?.[0]
    expect(lastCall?.[0]?.destinationWaypointTempId).toBe('wp-1')
  })
})
