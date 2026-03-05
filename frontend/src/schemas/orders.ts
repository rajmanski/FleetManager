import { z } from 'zod'

export const orderFormSchema = z.object({
  orderNumber: z.string().trim().min(1, 'Order number is required'),
  deliveryDeadline: z.string().trim().optional(),
  totalPricePln: z
    .string()
    .optional()
    .refine(
      (v) => !v || v === '' || (Number.isFinite(parseFloat(v)) && parseFloat(v) >= 0),
      'Price must be a non-negative number'
    ),
})

export type OrderFormValues = z.infer<typeof orderFormSchema>
