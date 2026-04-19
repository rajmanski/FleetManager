import { CargoSection } from '@/components/orders/CargoSection'
import type { WaypointOption } from '@/components/orders/CargoSection'
import type { CargoItemDraft } from '@/schemas/cargo'
import type { CargoItemErrors } from '@/utils/cargo'

type OrderPlanningCargoSectionProps = {
  items: CargoItemDraft[]
  onItemsChange: (items: CargoItemDraft[]) => void
  waypointDropoffOptions: WaypointOption[]
  itemErrors: Record<string, CargoItemErrors>
}

export function OrderPlanningCargoSection({
  items,
  onItemsChange,
  waypointDropoffOptions,
  itemErrors,
}: OrderPlanningCargoSectionProps) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-800">Cargo</h2>
      <CargoSection
        items={items}
        onChange={onItemsChange}
        waypoints={waypointDropoffOptions}
        itemErrors={itemErrors}
      />
    </section>
  )
}
