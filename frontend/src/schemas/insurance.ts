import { z } from 'zod'

const insuranceTypes = ['OC', 'AC'] as const

const nonNegativeNumber = (message: string) =>
  z
    .preprocess((v) => (v === '' || v == null ? NaN : Number(v)), z.number())
    .pipe(z.number().min(0, message))

export const insuranceFormSchema = z
  .object({
    vehicleId: z.string().min(1, 'Vehicle is required.'),
    type: z.enum(insuranceTypes, { message: 'Policy type is required.' }),
    policyNumber: z.string().trim().min(1, 'Policy number is required.'),
    insurer: z.string().trim().min(1, 'Insurer is required.'),
    startDate: z.string().min(1, 'Start date is required.'),
    endDate: z.string().min(1, 'End date is required.'),
    cost: nonNegativeNumber('Cost must be non-negative.'),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be on or after start date.',
    path: ['endDate'],
  })

export type InsuranceFormInput = z.input<typeof insuranceFormSchema>
export type InsuranceFormValues = z.output<typeof insuranceFormSchema>
