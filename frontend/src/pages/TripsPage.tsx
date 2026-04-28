import { PageHeader } from '@/components/ui/PageHeader'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { TripsFiltersBar } from '@/components/trips/TripsFiltersBar'
import { TripsTable } from '@/components/trips/TripsTable'
import { useTripsPage } from '@/hooks/trips/useTripsPage'

function TripsPage() {
  const {
    tripsQuery,
    pagedTrips,
    page,
    total,
    limit,
    pagination,
    statusFilter,
    search,
    handleStatusFilterChange,
    handleSearchChange,
  } = useTripsPage()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trips"
        description="List of planned and active trips with history"
      />

      <TripsFiltersBar
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        search={search}
        onSearchChange={handleSearchChange}
        limit={limit}
        pagination={pagination}
      />

      {tripsQuery.isLoading && <LoadingMessage />}
      {tripsQuery.isError && (
        <ErrorMessage message="Failed to load trips." />
      )}

      {tripsQuery.isSuccess && (
        <TripsTable
          trips={pagedTrips}
          page={page}
          total={total}
          pagination={pagination}
        />
      )}
    </div>
  )
}

export default TripsPage
