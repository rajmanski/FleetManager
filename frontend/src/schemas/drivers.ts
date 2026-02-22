import { z } from 'zod'
import { isValidPesel } from '../utils/pesel'

export const peselSchema = z
  .string()
  .trim()
  .length(11, 'PESEL must have exactly 11 digits')
  .refine((v) => /^\d{11}$/.test(v), 'PESEL must contain only digits')
  .refine((v) => isValidPesel(v), 'Invalid PESEL checksum')

const dateNotTooOld = (v: string) => {
  if (!v) return true
  const d = new Date(v)
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - 10)
  return d >= cutoff
}

export const driverFormSchema = z
  .object({
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
    license_number: z.string().trim().optional(),
    license_expiry_date: z
      .string()
      .optional()
      .refine((v) => !v || dateNotTooOld(v), 'Date cannot be more than 10 years in the past'),
    adr_certified: z.boolean().optional(),
    adr_expiry_date: z
      .string()
      .optional()
      .refine((v) => !v || dateNotTooOld(v), 'Date cannot be more than 10 years in the past'),
  })
  .refine(
    (data) => {
      if (!data.adr_expiry_date) return true
      return data.adr_certified === true
    },
    { message: 'ADR expiry date can only be set when ADR certified', path: ['adr_expiry_date'] }
  )

export type DriverFormValues = z.infer<typeof driverFormSchema>
