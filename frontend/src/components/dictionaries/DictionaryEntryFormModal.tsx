import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import type { DictionaryEntry } from '@/hooks/dictionaries/useDictionaries'
import {
  dictionaryEntryFormSchema,
  type DictionaryEntryFormValues,
} from '@/schemas/dictionaries'

type DictionaryEntryFormModalProps = {
  mode: 'create' | 'edit'
  categoryLabel: string
  entry: DictionaryEntry | null
  onClose: () => void
  onSubmit: (values: DictionaryEntryFormValues) => void
  isSubmitting: boolean
  errorMessage?: string | null
}

export function DictionaryEntryFormModal({
  mode,
  categoryLabel,
  entry,
  onClose,
  onSubmit,
  isSubmitting,
  errorMessage,
}: DictionaryEntryFormModalProps) {
  const title = mode === 'create' ? 'Add dictionary entry' : 'Edit dictionary entry'

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DictionaryEntryFormValues>({
    resolver: zodResolver(dictionaryEntryFormSchema),
    defaultValues: { key: '', value: '' },
  })

  useEffect(() => {
    if (mode === 'edit' && entry) {
      reset({ key: entry.key, value: entry.value })
    } else {
      reset({ key: '', value: '' })
    }
  }, [mode, entry, reset])

  return (
    <Modal title={title} error={errorMessage}>
      <p className="mt-2 text-sm text-gray-600">
        Category: <span className="font-medium text-gray-800">{categoryLabel}</span>
      </p>
      <form
        className="mt-4 space-y-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <Input
          label="Key"
          required
          autoComplete="off"
          error={errors.key?.message}
          {...register('key')}
        />
        <Input
          label="Value"
          required
          autoComplete="off"
          error={errors.value?.message}
          {...register('value')}
        />
        <div className="flex justify-start gap-2 pt-2 sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Add' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
