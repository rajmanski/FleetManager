import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { DictionaryEntry } from '@/hooks/dictionaries/useDictionaries'

type DeleteDictionaryEntryModalProps = {
  entry: DictionaryEntry
  onClose: () => void
  onConfirm: () => void
  isDeleting: boolean
}

export function DeleteDictionaryEntryModal({
  entry,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteDictionaryEntryModalProps) {
  return (
    <Modal title="Delete dictionary entry">
      <p className="mt-2 text-sm text-gray-600">
        Remove entry with key <strong className="font-mono">{entry.key}</strong>? This cannot be
        undone.
      </p>
      <div className="mt-6 flex justify-start gap-2 sm:justify-end">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={isDeleting}>
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
    </Modal>
  )
}
