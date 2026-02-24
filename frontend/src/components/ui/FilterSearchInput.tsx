type FilterSearchInputProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}

export function FilterSearchInput({
  label,
  value,
  onChange,
  placeholder,
}: FilterSearchInputProps) {
  return (
    <div className="min-w-56 flex-1">
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  )
}
