type FilterCheckboxProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  onToggle?: () => void
}

export function FilterCheckbox({
  checked,
  onChange,
  label,
  onToggle,
}: FilterCheckboxProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked
    onChange(newValue)
    onToggle?.()
  }

  return (
    <label className="inline-flex flex-wrap items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700">
      <input type="checkbox" checked={checked} onChange={handleChange} />
      {label}
    </label>
  )
}
