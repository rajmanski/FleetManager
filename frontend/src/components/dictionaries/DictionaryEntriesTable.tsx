import { Button } from '@/components/ui/Button'
import type { DictionaryEntry } from '@/hooks/dictionaries/useDictionaries'
import { formatDateTime } from '@/utils/date'

type DictionaryEntriesTableProps = {
  entries: DictionaryEntry[]
  onEdit: (entry: DictionaryEntry) => void
  onDelete: (entry: DictionaryEntry) => void
}

export function DictionaryEntriesTable({
  entries,
  onEdit,
  onDelete,
}: DictionaryEntriesTableProps) {
  if (entries.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        No entries in this category yet. Add one using the button above.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 font-medium text-gray-700">Key</th>
            <th className="px-4 py-3 font-medium text-gray-700">Value</th>
            <th className="px-4 py-3 font-medium text-gray-700">Created</th>
            <th className="px-4 py-3 font-medium text-gray-700 w-40">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {entries.map((row) => (
            <tr key={row.id} className="bg-white">
              <td className="px-4 py-3 font-mono text-xs text-gray-900">{row.key}</td>
              <td className="px-4 py-3 text-gray-800">{row.value}</td>
              <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                {formatDateTime(row.created_at)}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    className="px-3 py-1.5 text-xs"
                    onClick={() => onEdit(row)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger-outline"
                    className="px-3 py-1.5 text-xs"
                    onClick={() => onDelete(row)}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
