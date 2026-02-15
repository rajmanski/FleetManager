import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import api from '@/services/api'
import { clearSessionExpiredMessage, getSessionExpiredMessage } from '@/services/api'

function DashboardPage() {
  const [sessionMessage] = useState<string | null>(() => {
    const message = getSessionExpiredMessage()
    if (message) {
      clearSessionExpiredMessage()
    }
    return message
  })

  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await api.get('/api/v1/health')
      return response.data as { status: string }
    },
    enabled: false,
  })

  return (
    <div className="space-y-6">
      <div>
        <h2>Dashboard</h2>
        <p className="text-gray-600">System overview and key metrics snapshot</p>
      </div>
      {sessionMessage && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {sessionMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-600">Vehicles</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">-</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-600">Drivers</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">-</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-600">Orders</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">-</p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3>Backend health check</h3>
            <p className="text-sm text-gray-600">Manual verification of API availability</p>
          </div>
          <button
            type="button"
            onClick={() => void healthQuery.refetch()}
            className="rounded-lg bg-slate-700 px-4 py-2 text-white transition-colors hover:bg-slate-800"
          >
            {healthQuery.isFetching ? 'Checking...' : 'Check backend health'}
          </button>
        </div>
        <div className="mt-4 text-sm">
          {healthQuery.isSuccess && (
            <p className="rounded-md bg-green-100 px-3 py-2 text-green-700">
              Backend status: {healthQuery.data.status}
            </p>
          )}
          {healthQuery.isError && (
            <p className="rounded-md bg-red-100 px-3 py-2 text-red-700">
              Backend health check failed
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
