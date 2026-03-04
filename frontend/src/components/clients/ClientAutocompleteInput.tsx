import { useCallback, useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { FormField } from '@/components/ui/FormField'
import { Button } from '@/components/ui/Button'
import { INPUT_CLASS } from '@/constants/inputStyles'
import api from '@/services/api'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { ClientFormModal, type ClientFormValues } from '@/components/clients/ClientFormModal'
import { useClients } from '@/hooks/clients/useClients'
import { useMutationCallbacks } from '@/hooks/useMutationCallbacks'
import { extractApiError } from '@/utils/api'
import type { Client } from '@/hooks/clients/useClients'

const DEBOUNCE_MS = 300
const LIMIT = 10

function formatNipDisplay(nip: string) {
  const d = nip.replace(/\D/g, '').slice(0, 10)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`
  if (d.length <= 8) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8)}`
}

function clientDisplay(client: Client) {
  const nipFormatted = formatNipDisplay(client.nip)
  return `${client.companyName} (NIP: ${nipFormatted})`
}

type ListClientsResponse = {
  data: Client[]
  page: number
  limit: number
  total: number
}

type ClientAutocompleteInputProps = {
  label: string
  value?: Client | null
  onSelect: (client: Client | null) => void
  error?: string
  required?: boolean
  disabled?: boolean
  canAddClient?: boolean
}

export function ClientAutocompleteInput({
  label,
  value,
  onSelect,
  error,
  required,
  disabled,
  canAddClient = true,
}: ClientAutocompleteInputProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [inputValue, setInputValue] = useState(() => (value ? clientDisplay(value) : ''))
  const [results, setResults] = useState<Client[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)

  const { createMutation } = useClients({
    page: 1,
    limit: 10,
    search: '',
    showDeleted: false,
  })

  const createCallbacks = useMutationCallbacks({
    successMessage: 'Client added',
    errorFallback: 'Failed to add client',
  })

  const fetchClients = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const res = await api.get<ListClientsResponse>('/api/v1/clients', {
        params: { q: query.trim(), limit: LIMIT, page: 1, include_deleted: 'false' },
      })
      setResults(res.data.data ?? [])
      setShowDropdown(true)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const debouncedFetch = useDebouncedCallback(fetchClients, DEBOUNCE_MS)

  useEffect(() => {
    if (value !== undefined) {
      setInputValue(value ? clientDisplay(value) : '')
    }
  }, [value])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setInputValue(v)
    onSelect(null)
    debouncedFetch(v)
    if (!v.trim()) setResults([])
  }

  const handleSelect = (client: Client) => {
    onSelect(client)
    setInputValue(clientDisplay(client))
    setShowDropdown(false)
  }

  const handleAddClick = () => {
    setAddModalOpen(true)
  }

  const handleCreateSubmit = (values: ClientFormValues) => {
    createMutation.mutate(
      {
        companyName: values.companyName,
        nip: values.nip,
        address: values.address === '' ? undefined : values.address,
        contactEmail: values.contactEmail === '' ? undefined : values.contactEmail,
      },
      {
        onSuccess: (data) => {
          createCallbacks.onSuccess?.()
          setAddModalOpen(false)
          onSelect(data)
          setInputValue(clientDisplay(data))
          setShowDropdown(false)
        },
        onError: createCallbacks.onError,
      }
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <FormField label={label} error={error} required={required}>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            placeholder="Search by company name or NIP..."
            disabled={disabled}
            className={INPUT_CLASS}
            autoComplete="off"
          />
          {canAddClient && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddClick}
              disabled={disabled}
              className="shrink-0 px-3"
              title="Add new client"
            >
              <Plus className="size-4" />
            </Button>
          )}
        </div>
      </FormField>
      {loading && (
        <p className="mt-1 text-sm text-gray-500">Searching...</p>
      )}
      {showDropdown && results.length > 0 && (
        <ul
          className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
          role="listbox"
        >
          {results.map((client) => (
            <li
              key={client.id}
              role="option"
              tabIndex={0}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100"
              onClick={() => handleSelect(client)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSelect(client)
              }}
            >
              {clientDisplay(client)}
            </li>
          ))}
        </ul>
      )}

      {addModalOpen && (
        <ClientFormModal
          title="Add client"
          submitLabel={createMutation.isPending ? 'Adding...' : 'Add'}
          onClose={() => setAddModalOpen(false)}
          onSubmit={handleCreateSubmit}
          isSubmitting={createMutation.isPending}
          errorMessage={extractApiError(createMutation.error)}
        />
      )}
    </div>
  )
}
