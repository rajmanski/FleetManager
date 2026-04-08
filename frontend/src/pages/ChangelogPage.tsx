import { useCallback, useMemo, useState } from 'react'
import { ChangelogFiltersBar } from '@/components/changelog/ChangelogFiltersBar'
import { ChangelogTable } from '@/components/changelog/ChangelogTable'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { PageHeader } from '@/components/ui/PageHeader'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'
import { useChangelog } from '@/hooks/changelog/useChangelog'
import { usePagination } from '@/hooks/usePagination'

function ChangelogPage() {
  const [userIdFilter, setUserIdFilter] = useState('')
  const [tableNameFilter, setTableNameFilter] = useState('')
  const [operationFilter, setOperationFilter] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)

  const { changelogQuery } = useChangelog({
    page,
    limit,
    userId: userIdFilter,
    tableName: tableNameFilter,
    operation: operationFilter,
    dateFrom: dateFromFilter,
    dateTo: dateToFilter,
  })

  const total = changelogQuery.data?.total ?? 0
  const rows = useMemo(() => changelogQuery.data?.data ?? [], [changelogQuery.data])
  const pagination = usePagination({ page, setPage, limit, setLimit, total })

  const handleUserIdFilterChange = useCallback(
    (value: string) => {
      const sanitized = value.replace(/\D/g, '')
      setUserIdFilter(sanitized)
      pagination.resetPage()
    },
    [pagination],
  )

  const handleTableNameFilterChange = useCallback(
    (value: string) => {
      setTableNameFilter(value)
      pagination.resetPage()
    },
    [pagination],
  )

  const handleOperationFilterChange = useCallback(
    (value: string) => {
      setOperationFilter(value)
      pagination.resetPage()
    },
    [pagination],
  )

  const handleDateFromFilterChange = useCallback(
    (value: string) => {
      setDateFromFilter(value)
      pagination.resetPage()
    },
    [pagination],
  )

  const handleDateToFilterChange = useCallback(
    (value: string) => {
      setDateToFilter(value)
      pagination.resetPage()
    },
    [pagination],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Changelog"
        description="Audit trail for data-changing operations (admin only)"
      />

      <ChangelogFiltersBar
        userIdFilter={userIdFilter}
        onUserIdFilterChange={handleUserIdFilterChange}
        tableNameFilter={tableNameFilter}
        onTableNameFilterChange={handleTableNameFilterChange}
        operationFilter={operationFilter}
        onOperationFilterChange={handleOperationFilterChange}
        dateFromFilter={dateFromFilter}
        onDateFromFilterChange={handleDateFromFilterChange}
        dateToFilter={dateToFilter}
        onDateToFilterChange={handleDateToFilterChange}
        limit={limit}
        pagination={pagination}
      />

      {changelogQuery.isLoading && <LoadingMessage />}
      {changelogQuery.isError && <ErrorMessage message="Failed to load changelog entries." />}

      {changelogQuery.isSuccess && rows.length === 0 && (
        <p className="text-sm text-gray-500">No changelog entries match current filters.</p>
      )}

      {changelogQuery.isSuccess && rows.length > 0 && (
        <ChangelogTable rows={rows} page={page} total={total} pagination={pagination} />
      )}
    </div>
  )
}

export default ChangelogPage
