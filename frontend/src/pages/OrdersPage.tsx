import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { ClientAutocompleteInput } from '@/components/clients/ClientAutocompleteInput'
import { useAuth } from '@/hooks/useAuth'
import type { Client } from '@/hooks/clients/useClients'

function OrdersPage() {
  const { role } = useAuth()
  const canManageOrders = role === 'Administrator' || role === 'Spedytor'
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Transport orders management"
      />
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <form className="space-y-4 max-w-xl">
          <ClientAutocompleteInput
            label="Client"
            value={selectedClient}
            onSelect={setSelectedClient}
            required
            canAddClient={canManageOrders}
          />
          {/* Additional order fields (cargo, price, etc.) will be added in future tasks */}
        </form>
      </div>
    </div>
  )
}

export default OrdersPage
