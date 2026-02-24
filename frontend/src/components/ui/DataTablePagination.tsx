import { Button } from '@/components/ui/Button'
import type { PaginationHelpers } from '@/hooks/usePagination'

type DataTablePaginationProps = {
  page: number
  total: number
  pagination: Pick<PaginationHelpers, 'totalPages' | 'canGoPrev' | 'canGoNext' | 'goPrev' | 'goNext'>
  children: React.ReactNode
}

export function DataTablePagination({
  page,
  total,
  pagination,
  children,
}: DataTablePaginationProps) {
  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600">
        Showing page {page} of {pagination.totalPages} ({total} results)
      </div>
      {children}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="secondary"
          onClick={pagination.goPrev}
          disabled={!pagination.canGoPrev}
          className="px-3 py-1.5 text-sm"
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          onClick={pagination.goNext}
          disabled={!pagination.canGoNext}
          className="px-3 py-1.5 text-sm"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
