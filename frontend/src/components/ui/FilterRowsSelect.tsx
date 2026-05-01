import { FILTER_CONTROL_BASE_CLASS } from '@/constants/inputStyles'
import { PAGINATION_LIMITS } from '@/constants/pagination'

type FilterRowsSelectProps = {
  value: number
  onChange: (value: number) => void
}

export function FilterRowsSelect({ value, onChange }: FilterRowsSelectProps) {
  return (
    <div className="min-w-0 sm:min-w-32">
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
        Rows
      </label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`${FILTER_CONTROL_BASE_CLASS} text-gray-900`}
      >
        {PAGINATION_LIMITS.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    </div>
  )
}
