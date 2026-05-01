import { Button } from '@/components/ui/Button'

type TableActionsCellProps = {
  isDeleted: boolean
  isAdmin: boolean
  canManage: boolean
  onRestore: () => void
  onEdit: () => void
  isRestoring: boolean
  onSoftDelete?: () => void
  isSoftDeleting?: boolean
}

export function TableActionsCell({
  isDeleted,
  isAdmin,
  canManage,
  onRestore,
  onEdit,
  isRestoring,
  onSoftDelete,
  isSoftDeleting,
}: TableActionsCellProps) {
  return (
    <div className="flex flex-wrap items-center gap-2" onClick={(event) => event.stopPropagation()}>
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
        <>
          <Button
            variant="secondary"
            onClick={onEdit}
            className="px-3 py-1.5 text-xs"
          >
            Edit
          </Button>
          {isAdmin && onSoftDelete && (
            <Button
              variant="danger"
              onClick={onSoftDelete}
              disabled={isSoftDeleting}
              className="px-3 py-1.5 text-xs"
            >
              {isSoftDeleting ? 'Deleting...' : 'Soft delete'}
            </Button>
          )}
        </>
      )}
      {!isDeleted && !canManage && !isAdmin && (
        <span className="text-xs text-gray-400">-</span>
      )}
    </div>
  )
}
