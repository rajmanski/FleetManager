type FilterSelectOption = { value: string; label?: string }

type FilterSelectProps = {
  label: string
  value: string
  onChange: (value: string) => void
  options: ReadonlyArray<FilterSelectOption | string>
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
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
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="">All</option>
        {normalizedOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label ?? opt.value}
          </option>
        ))}
      </select>
    </div>
  )
}
