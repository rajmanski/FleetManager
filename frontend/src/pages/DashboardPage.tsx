import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import api from '@/services/api'

function DashboardPage() {
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
      <PageHeader
        title="Dashboard"
        description="System overview and key metrics snapshot"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Vehicles" value="-" />
        <StatCard label="Drivers" value="-" />
        <StatCard label="Orders" value="-" />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3>Backend health check</h3>
            <p className="text-sm text-gray-600">Manual verification of API availability</p>
          </div>
          <Button onClick={() => void healthQuery.refetch()}>
            {healthQuery.isFetching ? 'Checking...' : 'Check backend health'}
          </Button>
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
