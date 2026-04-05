import { FilterSelect } from '@/components/ui/FilterSelect'
import { NOTIFICATION_TYPE_FILTER_OPTIONS } from '@/constants/notifications'

type NotificationsFiltersBarProps = {
  typeFilter: string
  onTypeFilterChange: (value: string) => void
}

export function NotificationsFiltersBar({
  typeFilter,
  onTypeFilterChange,
}: NotificationsFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <FilterSelect
        label="Type"
        value={typeFilter}
        onChange={onTypeFilterChange}
        options={NOTIFICATION_TYPE_FILTER_OPTIONS}
      />
    </div>
  )
}
