import { z } from 'zod'

const costCategories = ['Tolls', 'Other'] as const

const positiveNumber = (message: string) =>
  z.preprocess((v) => (v === '' || v == null ? NaN : Number(v)), z.number()).pipe(z.number().gt(0, message))

export const costsFormSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required.'),
  category: z.enum(costCategories, { message: 'Category is required.' }),
  amount: positiveNumber('Amount must be greater than 0.'),
  date: z.string().min(1, 'Date is required.'),
  description: z.string().trim().optional(),
  invoiceNumber: z.string().trim().optional(),
})

export type CostsFormInput = z.input<typeof costsFormSchema>
export type CostsFormValues = z.output<typeof costsFormSchema>

