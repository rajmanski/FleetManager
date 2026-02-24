import { Button } from '@/components/ui/Button'

type TableActionsCellProps = {
  isDeleted: boolean
  isAdmin: boolean
  canManage: boolean
  onRestore: () => void
  onEdit: () => void
  isRestoring: boolean
}

export function TableActionsCell({
  isDeleted,
  isAdmin,
  canManage,
  onRestore,
  onEdit,
  isRestoring,
}: TableActionsCellProps) {
  return (
    <div className="flex items-center gap-2">
      {isAdmin && isDeleted && (
        <Button
          variant="secondary"
          onClick={onRestore}
          disabled={isRestoring}
          className="px-3 py-1.5 text-xs"
        >
          {isRestoring ? 'Restoring...' : 'Restore'}
        </Button>
      )}
      {!isDeleted && canManage && (
        <Button
          variant="secondary"
          onClick={onEdit}
          className="px-3 py-1.5 text-xs"
        >
          Edit
        </Button>
      )}
      {!isDeleted && !canManage && !isAdmin && (
        <span className="text-xs text-gray-400">-</span>
      )}
    </div>
  )
}
