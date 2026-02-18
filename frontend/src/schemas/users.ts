import { z } from 'zod'

const ROLE_OPTIONS = ['Administrator', 'Spedytor', 'Mechanik'] as const

export const ROLE_OPTIONS_WITH_LABELS: { value: (typeof ROLE_OPTIONS)[number]; label: string }[] = [
  { value: 'Administrator', label: 'Administrator' },
  { value: 'Spedytor', label: 'Dispatcher' },
  { value: 'Mechanik', label: 'Mechanic' },
]

export const createUserSchema = z.object({
  login: z
    .string()
    .trim()
    .min(1, 'Login is required')
    .transform((v) => v.replace(/[<>]/g, '').toLowerCase()),
  password: z
    .string()
    .trim()
    .min(1, 'Password is required')
    .transform((v) => v.replace(/[<>]/g, '')),
  email: z.string().trim().min(1, 'Email is required').email('Invalid email address'),
  role: z.enum(ROLE_OPTIONS, { error: 'Select a role' }),
})

export type CreateUserFormValues = z.infer<typeof createUserSchema>

export const updateUserSchema = z.object({
  login: z
    .string()
    .trim()
    .min(1, 'Login is required')
    .transform((v) => v.replace(/[<>]/g, '').toLowerCase()),
  email: z.string().trim().min(1, 'Email is required').email('Invalid email address'),
  role: z.enum(ROLE_OPTIONS, { error: 'Select a role' }),
  password: z.string().transform((v) => v.trim().replace(/[<>]/g, '')),
})

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>
