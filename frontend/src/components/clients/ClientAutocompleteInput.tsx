import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { AutocompleteInput } from '@/components/ui/AutocompleteInput'
import { Button } from '@/components/ui/Button'
import api from '@/services/api'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { ClientFormModal, type ClientFormValues } from '@/components/clients/ClientFormModal'
import { useClients } from '@/hooks/clients/useClients'
import { useMutationCallbacks } from '@/hooks/useMutationCallbacks'
import { extractApiError } from '@/utils/api'
import { formatNipDisplay } from '@/utils/nip'
import type { Client } from '@/hooks/clients/useClients'
import type { PaginatedResponse } from '@/types/common'

const DEBOUNCE_MS = 300
const LIMIT = 10

function clientDisplay(client: Client) {
  const nipFormatted = formatNipDisplay(client.nip)
  return `${client.companyName} (NIP: ${nipFormatted})`
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
  const [inputValue, setInputValue] = useState(() => (value ? clientDisplay(value) : ''))
  const [results, setResults] = useState<Client[]>([])
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
    setLoading(true)
    try {
      const res = await api.get<PaginatedResponse<Client>>('/api/v1/clients', {
        params: {
          q: query.trim(),
          limit: LIMIT,
          page: 1,
          include_deleted: 'false',
        },
      })
      setResults(res.data.data ?? [])
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
    void fetchClients('')
  }, [fetchClients])

  const handleInputChange = (v: string) => {
    setInputValue(v)
    onSelect(null)
    debouncedFetch(v)
  }

  const handleSelect = (client: Client) => {
    onSelect(client)
    setInputValue(clientDisplay(client))
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
        },
        onError: createCallbacks.onError,
      }
    )
  }

  return (
    <>
      <AutocompleteInput<Client>
        label={label}
        error={error}
        required={required}
        value={inputValue}
        onChange={handleInputChange}
        options={results}
        getOptionKey={(c) => c.id}
        renderOption={clientDisplay}
        onSelect={handleSelect}
        loading={loading}
        placeholder="Search by company name or NIP..."
        disabled={disabled}
        trailingSlot={
          canAddClient ? (
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
          ) : undefined
        }
      />

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
    </>
  )
}
