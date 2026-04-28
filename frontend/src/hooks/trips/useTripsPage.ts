import { useCallback, useMemo, useState } from 'react'
import { useTripsList } from '@/hooks/trips/useTrips'
import { usePagination } from '@/hooks/usePagination'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'

export function useTripsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)

  const { tripsQuery } = useTripsList({ status: statusFilter })

  const allTrips = useMemo(() => tripsQuery.data ?? [], [tripsQuery.data])

  const filteredTrips = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return allTrips

    return allTrips.filter((trip) => {
      const vin = trip.vehicle_vin?.toLowerCase() ?? ''
      const driver = trip.driver_name?.toLowerCase() ?? ''
      const orderNumber = trip.order_number?.toLowerCase() ?? ''
      return (
        vin.includes(term) ||
        driver.includes(term) ||
        orderNumber.includes(term)
      )
    })
  }, [allTrips, search])

  const sortedTrips = useMemo(() => {
    return [...filteredTrips].sort((a, b) => {
      const aTime = a.start_time ? new Date(a.start_time).getTime() : 0
      const bTime = b.start_time ? new Date(b.start_time).getTime() : 0
      return bTime - aTime
    })
  }, [filteredTrips])

  const total = sortedTrips.length
  const pagination = usePagination({ page, setPage, limit, setLimit, total })

  const pagedTrips = useMemo(() => {
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    return sortedTrips.slice(startIndex, endIndex)
  }, [sortedTrips, page, limit])

  const handleStatusFilterChange = useCallback(
    (value: string) => {
      setStatusFilter(value)
      pagination.resetPage()
    },
    [pagination]
  )

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value)
      pagination.resetPage()
    },
    [pagination]
  )

  return {
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
  }
}
