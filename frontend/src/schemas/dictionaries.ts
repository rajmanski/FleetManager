import { z } from 'zod'

export const dictionaryEntryFormSchema = z.object({
  key: z.string().trim().min(1, 'Key is required').max(128),
  value: z.string().trim().min(1, 'Value is required').max(500),
})

export type DictionaryEntryFormValues = z.infer<typeof dictionaryEntryFormSchema>
