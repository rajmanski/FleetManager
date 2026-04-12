import { ChangelogUnifiedJsonDiff } from '@/components/changelog/ChangelogUnifiedJsonDiff'

type ChangelogDiffFieldsProps = {
  oldData?: unknown
  newData?: unknown
  emptyMessage?: string
}

function formatJsonBlock(data: unknown) {
  return JSON.stringify(data ?? null, null, 2)
}

export function ChangelogDiffFields({
  oldData,
  newData,
  emptyMessage = 'No data in this entry.',
}: ChangelogDiffFieldsProps) {
  const oldText = formatJsonBlock(oldData)
  const newText = formatJsonBlock(newData)
  const bothNullish = oldText === 'null' && newText === 'null'

  if (bothNullish) {
    return <p className="text-xs text-gray-500">{emptyMessage}</p>
  }

  const contentDiffers = oldText !== newText

  if (!contentDiffers) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-600">No line-level changes — payloads are identical.</p>
        <pre className="max-h-64 overflow-auto rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
          {oldText}
        </pre>
      </div>
    )
  }

  return <ChangelogUnifiedJsonDiff oldText={oldText} newText={newText} />
}
