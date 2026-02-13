import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'

function App() {
  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await api.get('/api/v1/health')
      return response.data as { status: string }
    },
    enabled: false,
  })

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-semibold">Fleet Manager</h1>
      <div className="mt-4">
        <button
          type="button"
          onClick={() => void healthQuery.refetch()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          {healthQuery.isFetching ? 'Checking...' : 'Check backend health'}
        </button>
        <div className="mt-3 text-sm">
          {healthQuery.isSuccess && (
            <p className="text-green-700">Backend status: {healthQuery.data.status}</p>
          )}
          {healthQuery.isError && (
            <p className="text-red-700">Backend health check failed</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
