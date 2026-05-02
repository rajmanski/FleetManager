import { Button } from '@/components/ui/Button'

type ModalFooterProps = {
  onCancel: () => void
  cancelLabel?: string
  submitLabel?: string
  isSubmitting?: boolean
}

export function ModalFooter({
  onCancel,
  cancelLabel = 'Cancel',
  submitLabel = 'Save',
  isSubmitting = false,
}: ModalFooterProps) {
  return (
    <div className="mt-5 grid grid-cols-1 gap-2 sm:flex sm:justify-end">
      <Button variant="secondary" className="w-full sm:w-auto" onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button variant="primary" type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
        {submitLabel}
      </Button>
    </div>
  )
}
