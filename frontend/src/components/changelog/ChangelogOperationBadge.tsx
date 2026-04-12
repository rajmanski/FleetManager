type ChangelogOperationBadgeProps = {
  operation: string
}

export function operationBadgeClass(operation: string) {
  switch (operation) {
    case 'INSERT':
      return 'bg-green-100 text-green-700'
    case 'UPDATE':
      return 'bg-amber-100 text-amber-700'
    case 'DELETE':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

export function ChangelogOperationBadge({ operation }: ChangelogOperationBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${operationBadgeClass(operation)}`}
    >
      {operation}
    </span>
  )
}
