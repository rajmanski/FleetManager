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
    <div className="mt-5 flex flex-wrap justify-start gap-2 sm:justify-end">
      <Button variant="secondary" onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button type="submit" variant="primary" disabled={isSubmitting}>
        {submitLabel}
      </Button>
    </div>
  )
}
