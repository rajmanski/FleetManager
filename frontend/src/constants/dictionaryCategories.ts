export const DICTIONARY_CATEGORIES = [
  { id: 'cargo_types', label: 'Cargo types' },
  { id: 'vehicle_statuses', label: 'Vehicle statuses' },
  { id: 'maintenance_types', label: 'Maintenance types' },
  { id: 'maintenance_statuses', label: 'Maintenance statuses' },
] as const

export type DictionaryCategoryId = (typeof DICTIONARY_CATEGORIES)[number]['id']
