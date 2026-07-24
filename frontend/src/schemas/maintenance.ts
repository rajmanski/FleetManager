import { z } from 'zod'

const nonNegativeNumber = (message: string) =>
  z
    .preprocess((v) => (v === '' || v == null ? 0 : Number(v)), z.number())
    .pipe(z.number().min(0, message))

export const maintenanceFormSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required.'),
  type: z.string().min(1, 'Type is required.'),
  scheduledDate: z.string().min(1, 'Scheduled date is required.'),
  description: z.string().trim().optional(),
  partsCostPln: nonNegativeNumber('Parts cost must be non-negative.'),
  laborCostPln: nonNegativeNumber('Labor cost must be non-negative.'),
})

export type MaintenanceFormInput = z.input<typeof maintenanceFormSchema>
export type MaintenanceFormValues = z.output<typeof maintenanceFormSchema>

