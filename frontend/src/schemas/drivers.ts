import { z } from 'zod'
import { isValidPesel } from '../utils/pesel'

export const peselSchema = z
  .string()
  .trim()
  .length(11, 'PESEL must have exactly 11 digits')
  .refine((v) => /^\d{11}$/.test(v), 'PESEL must contain only digits')
  .refine((v) => isValidPesel(v), 'Invalid PESEL checksum')
