import { z } from 'zod'

const nonNegativeNumber = (message: string) =>
  z
    .preprocess((v) => (v === '' || v == null ? NaN : Number(v)), z.number())
    .pipe(z.number().min(0, message))

export const fuelFormSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle is required.'),
  date: z.string().min(1, 'Date is required.'),
  liters: nonNegativeNumber('Liters must be non-negative.'),
  pricePerLiter: nonNegativeNumber('Price per liter must be non-negative.'),
  mileage: z
    .preprocess((v) => (v === '' || v == null ? NaN : Number(v)), z.number())
    .pipe(z.number().int('Mileage must be an integer.').min(0, 'Mileage must be non-negative.')),
  location: z.string().trim().optional(),
})

export type FuelFormInput = z.input<typeof fuelFormSchema>
export type FuelFormValues = z.output<typeof fuelFormSchema>

