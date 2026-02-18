import { z } from 'zod'

export const loginSchema = z.object({
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
})

export type LoginFormValues = z.infer<typeof loginSchema>
