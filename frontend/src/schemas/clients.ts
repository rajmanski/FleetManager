import { z } from 'zod'
import { normalizeNipDigits } from '@/utils/nip'

export const clientFormSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(3, 'Company name must be at least 3 characters'),
  nip: z
    .string()
    .refine((v) => {
      const digits = normalizeNipDigits(v)
      return digits.length === 10 && /^\d{10}$/.test(digits)
    }, 'NIP must contain exactly 10 digits'),
  address: z.string().trim(),
  contactEmail: z
    .string()
    .trim()
    .refine((v) => v === '' || v.includes('@'), 'Invalid email format'),
})

export type ClientFormValues = z.infer<typeof clientFormSchema>
