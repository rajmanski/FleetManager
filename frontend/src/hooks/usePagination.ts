import { useCallback } from 'react'

type UsePaginationParams = {
  page: number
  setPage: (v: number | ((p: number) => number)) => void
  limit: number
  setLimit: (v: number) => void
  total: number
}

export function usePagination({
  page,
  setPage,
  limit,
  setLimit,
  total,
}: UsePaginationParams) {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const canGoPrev = page > 1
  const canGoNext = page < totalPages

  const goPrev = useCallback(() => {
    setPage((p: number) => (p > 1 ? p - 1 : p))
  }, [setPage])

  const goNext = useCallback(() => {
    setPage((p: number) => (p < totalPages ? p + 1 : p))
  }, [setPage, totalPages])

  const resetPage = useCallback(() => setPage(1), [setPage])

  const handleLimitChange = useCallback(
    (value: number) => {
      setLimit(value)
      setPage(1)
    },
    [setLimit, setPage]
  )

  return {
    totalPages,
    canGoPrev,
    canGoNext,
    goPrev,
    goNext,
    resetPage,
    handleLimitChange,
  }
}
