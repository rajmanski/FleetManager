import { z } from 'zod'
import { isValidPesel } from '../utils/pesel'

export const peselSchema = z
  .string()
  .trim()
  .length(11, 'PESEL must have exactly 11 digits')
  .refine((v) => /^\d{11}$/.test(v), 'PESEL must contain only digits')
  .refine((v) => isValidPesel(v), 'Invalid PESEL checksum')

export const driverFormSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required'),
  last_name: z.string().trim().min(1, 'Last name is required'),
  pesel: peselSchema,
  phone: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Invalid email'),
  status: z.enum(['Available', 'OnLeave', 'InRoute']),
})

export type DriverFormValues = z.infer<typeof driverFormSchema>
