import { FILTER_CONTROL_BASE_CLASS } from '@/constants/inputStyles'

type FilterSelectOption = { value: string; label?: string }

type FilterSelectProps = {
  label: string
  value: string
  onChange: (value: string) => void
  options: ReadonlyArray<FilterSelectOption | string>
  allowEmpty?: boolean
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  allowEmpty = true,
}: FilterSelectProps) {
  const normalizedOptions: FilterSelectOption[] =
    options.length > 0 && typeof options[0] === 'string'
      ? (options as readonly string[]).map((v) => ({ value: v, label: v }))
      : (options as ReadonlyArray<FilterSelectOption>).map((o) => ({
          value: o.value,
          label: o.label,
        }))

  return (
    <div className="min-w-44">
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${FILTER_CONTROL_BASE_CLASS} text-gray-900`}
      >
        {allowEmpty && <option value="">All</option>}
        {normalizedOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label ?? opt.value}
          </option>
        ))}
      </select>
    </div>
  )
}
