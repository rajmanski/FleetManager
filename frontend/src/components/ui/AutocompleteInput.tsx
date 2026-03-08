import { useEffect, useRef, useState } from 'react'
import { FormField } from '@/components/ui/FormField'
import { INPUT_CLASS } from '@/constants/inputStyles'

export type AutocompleteInputProps<T> = {
  label: string
  error?: string
  required?: boolean
  value: string
  onChange: (value: string) => void
  onFocus?: () => void
  options: T[]
  getOptionKey: (item: T) => string | number
  renderOption: (item: T) => React.ReactNode
  onSelect: (item: T) => void
  loading?: boolean
  placeholder?: string
  disabled?: boolean
  autoComplete?: string
  trailingSlot?: React.ReactNode
}

export function AutocompleteInput<T>({
  label,
  error,
  required,
  value,
  onChange,
  onFocus,
  options,
  getOptionKey,
  renderOption,
  onSelect,
  loading = false,
  placeholder,
  disabled,
  autoComplete = 'off',
  trailingSlot,
}: AutocompleteInputProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (item: T) => {
    onSelect(item)
    setShowDropdown(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    setShowDropdown(true)
  }

  const handleInputFocus = () => {
    if (options.length > 0) setShowDropdown(true)
    onFocus?.()
  }

  return (
    <div ref={containerRef} className="relative">
      <FormField label={label} error={error} required={required}>
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            disabled={disabled}
            className={INPUT_CLASS}
            autoComplete={autoComplete}
          />
          {trailingSlot}
        </div>
      </FormField>
      {loading && (
        <p className="mt-1 text-sm text-gray-500">Searching...</p>
      )}
      {showDropdown && options.length > 0 && (
        <ul
          className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
          role="listbox"
        >
          {options.map((item) => (
            <li
              key={getOptionKey(item)}
              role="option"
              tabIndex={0}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100"
              onClick={() => handleSelect(item)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSelect(item)
              }}
            >
              {renderOption(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
