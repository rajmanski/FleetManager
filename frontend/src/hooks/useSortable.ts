import { useMemo, useState, useCallback } from 'react'
import type { SortConfig, SortDirection } from '@/components/ui/SortableTh'

export type SortValueGetter<T> = (item: T, column: string) => string | number | boolean | null | undefined

export function useSortable<T>(
  data: T[],
  defaultColumn: string,
  getValue: SortValueGetter<T>,
  defaultDirection: SortDirection = 'asc'
) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: defaultColumn, direction: defaultDirection })

  const onSort = useCallback((column: string) => {
    setSortConfig((prev) => {
      if (prev?.column === column) {
        return { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { column, direction: 'asc' }
    })
  }, [])

  const sortedData = useMemo(() => {
    if (!sortConfig) return data

    const { column, direction } = sortConfig
    const multiplier = direction === 'asc' ? 1 : -1

    return [...data].sort((a, b) => {
      const aVal = getValue(a, column)
      const bVal = getValue(b, column)

      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return 1

      if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        return (aVal === bVal ? 0 : aVal ? 1 : -1) * multiplier
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * multiplier
      }

      return String(aVal).localeCompare(String(bVal), undefined, { numeric: true }) * multiplier
    })
  }, [data, sortConfig, getValue])

  return { sortedData, sortConfig, onSort }
}
