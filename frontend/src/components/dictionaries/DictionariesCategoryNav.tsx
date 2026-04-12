import { DICTIONARY_CATEGORIES } from '@/constants/dictionaryCategories'

type DictionariesCategoryNavProps = {
  selectedId: string
  onSelect: (categoryId: string) => void
}

export function DictionariesCategoryNav({
  selectedId,
  onSelect,
}: DictionariesCategoryNavProps) {
  return (
    <nav
      className="flex shrink-0 flex-col gap-1 rounded-lg border border-gray-200 bg-white p-2 md:w-56"
      aria-label="Dictionary categories"
    >
      {DICTIONARY_CATEGORIES.map((cat) => {
        const active = cat.id === selectedId
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className={`rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
              active
                ? 'bg-slate-100 text-slate-800'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {cat.label}
          </button>
        )
      })}
    </nav>
  )
}
