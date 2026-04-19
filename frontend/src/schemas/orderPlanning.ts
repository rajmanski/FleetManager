import { z } from 'zod'
import { CARGO_TYPES } from '@/schemas/cargo'

const planningCargoRowSchema = z
  .object({
    id: z.string(),
    description: z.string(),
    quantity: z.string(),
    weightPerUnitKg: z.string(),
    volumePerUnitM3: z.string(),
    cargoType: z.enum(CARGO_TYPES),
    destinationWaypointId: z.number().nullable().optional(),
    destinationWaypointTempId: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    const quantity = parseInt(String(data.quantity), 10)
    const weightPerUnit = parseFloat(String(data.weightPerUnitKg))
    const volumePerUnit = parseFloat(String(data.volumePerUnitM3))

    if (!Number.isFinite(quantity) || quantity < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Quantity must be at least 1',
        path: ['quantity'],
      })
    }
    if (!Number.isFinite(weightPerUnit) || weightPerUnit <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Weight per unit must be greater than 0',
        path: ['weightPerUnitKg'],
      })
    }
    if (!Number.isFinite(volumePerUnit) || volumePerUnit <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Volume per unit must be greater than 0',
        path: ['volumePerUnitM3'],
      })
    }
  })

export const orderPlanningFormSchema = z.object({
  clientId: z
    .number()
    .refine((n) => Number.isFinite(n) && n > 0, 'Client is required'),
  orderNumber: z.string().trim().min(1, 'Order number is required'),
  deliveryDeadline: z.string().optional(),
  totalPricePln: z
    .string()
    .optional()
    .refine(
      (v) =>
        !v ||
        v === '' ||
        (Number.isFinite(parseFloat(v)) && parseFloat(v) >= 0),
      'Price must be a non-negative number',
    ),
  cargo: z.array(planningCargoRowSchema).min(1, 'At least one cargo row is required'),
  vehicleId: z.string().min(1, 'Vehicle is required'),
  driverId: z.string().min(1, 'Driver is required'),
  startTime: z.string().min(1, 'Trip start time is required'),
})

export type OrderPlanningFormValues = z.infer<typeof orderPlanningFormSchema>
