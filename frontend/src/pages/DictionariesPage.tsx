import { useMemo, useState } from 'react'
import { DeleteDictionaryEntryModal } from '@/components/dictionaries/DeleteDictionaryEntryModal'
import { DictionariesCategoryNav } from '@/components/dictionaries/DictionariesCategoryNav'
import { DictionaryEntriesTable } from '@/components/dictionaries/DictionaryEntriesTable'
import { DictionaryEntryFormModal } from '@/components/dictionaries/DictionaryEntryFormModal'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { PageHeader } from '@/components/ui/PageHeader'
import { DICTIONARY_CATEGORIES } from '@/constants/dictionaryCategories'
import {
  useDictionaries,
  type DictionaryEntry,
} from '@/hooks/dictionaries/useDictionaries'
import { useMutationCallbacks } from '@/hooks/useMutationCallbacks'
import type { DictionaryEntryFormValues } from '@/schemas/dictionaries'
import { extractApiError } from '@/utils/api'

function DictionariesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>(
    DICTIONARY_CATEGORIES[0].id,
  )
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editEntry, setEditEntry] = useState<DictionaryEntry | null>(null)
  const [deleteEntry, setDeleteEntry] = useState<DictionaryEntry | null>(null)

  const categoryMeta = useMemo(
    () => DICTIONARY_CATEGORIES.find((c) => c.id === selectedCategory),
    [selectedCategory],
  )

  const { listQuery, createMutation, updateMutation, deleteMutation } =
    useDictionaries(selectedCategory)

  const createCallbacks = useMutationCallbacks({
    successMessage: 'Entry added',
    errorFallback: 'Failed to add entry',
    onSuccess: () => setFormOpen(false),
  })
  const updateCallbacks = useMutationCallbacks({
    successMessage: 'Entry updated',
    errorFallback: 'Failed to update entry',
    onSuccess: () => {
      setFormOpen(false)
      setEditEntry(null)
    },
  })
  const deleteCallbacks = useMutationCallbacks({
    successMessage: 'Entry deleted',
    errorFallback: 'Failed to delete entry',
    onSuccess: () => setDeleteEntry(null),
  })

  const openCreate = () => {
    setFormMode('create')
    setEditEntry(null)
    setFormOpen(true)
  }

  const openEdit = (entry: DictionaryEntry) => {
    setFormMode('edit')
    setEditEntry(entry)
    setFormOpen(true)
  }

  const handleFormSubmit = (values: DictionaryEntryFormValues) => {
    if (formMode === 'create') {
      createMutation.mutate(
        { category: selectedCategory, ...values },
        createCallbacks,
      )
      return
    }
    if (editEntry) {
      updateMutation.mutate(
        {
          id: editEntry.id,
          category: editEntry.category,
          key: values.key,
          value: values.value,
        },
        updateCallbacks,
      )
    }
  }

  const handleDeleteConfirm = () => {
    if (deleteEntry) {
      deleteMutation.mutate(
        { id: deleteEntry.id, category: deleteEntry.category },
        deleteCallbacks,
      )
    }
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditEntry(null)
  }

  const activeMutation =
    formMode === 'create' ? createMutation : updateMutation

  return (
    <div className="space-y-6">
      <PageHeader
        title="System dictionaries"
        description="Manage configurable values per category (admin only)"
      />

      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <DictionariesCategoryNav
          selectedId={selectedCategory}
          onSelect={setSelectedCategory}
        />

        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold text-slate-800">
              {categoryMeta?.label ?? selectedCategory}
            </h2>
            <Button onClick={openCreate}>Add entry</Button>
          </div>

          {listQuery.isLoading && <LoadingMessage />}
          {listQuery.isError && (
            <ErrorMessage message="Failed to load dictionary entries." />
          )}
          {listQuery.isSuccess && listQuery.data && (
            <DictionaryEntriesTable
              entries={listQuery.data}
              onEdit={openEdit}
              onDelete={setDeleteEntry}
            />
          )}
        </div>
      </div>

      {formOpen && (
        <DictionaryEntryFormModal
          mode={formMode}
          categoryLabel={categoryMeta?.label ?? selectedCategory}
          entry={formMode === 'edit' ? editEntry : null}
          onClose={closeForm}
          onSubmit={handleFormSubmit}
          isSubmitting={activeMutation.isPending}
          errorMessage={extractApiError(activeMutation.error)}
        />
      )}

      {deleteEntry && (
        <DeleteDictionaryEntryModal
          entry={deleteEntry}
          onClose={() => setDeleteEntry(null)}
          onConfirm={handleDeleteConfirm}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  )
}

export default DictionariesPage
