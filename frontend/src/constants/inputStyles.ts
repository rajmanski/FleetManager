export const INPUT_CLASS =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500'

export const INPUT_CLASS_COMPACT =
  'w-full min-w-0 rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500'

export const INPUT_NUMERIC_CLASS =
  'w-[7ch] min-w-[7ch] rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500'

export const INPUT_NUMERIC_DECIMAL_CLASS =
  'w-[14ch] min-w-[14ch] rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500'


export const FILTER_CONTROL_BASE_CLASS =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500'


export function filterDateControlClassName(value: string): string {
  const set = value.trim() !== ''
  return `${FILTER_CONTROL_BASE_CLASS} ${set ? 'text-gray-900' : 'text-gray-400'}`
}
