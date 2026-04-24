import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { EMPTY_CARGO_ITEM } from '@/schemas/cargo'
import type { CargoItemDraft } from '@/schemas/cargo'
import {
  orderPlanningFormSchema,
  type OrderPlanningFormValues,
} from '@/schemas/orderPlanning'
import { generateCargoId } from '@/utils/cargo'

export function useOrderPlanningFormState() {
  const form = useForm<OrderPlanningFormValues>({
    resolver: zodResolver(orderPlanningFormSchema),
    defaultValues: {
      clientId: 0,
      orderNumber: '',
      deliveryDeadline: '',
      totalPricePln: '',
      cargo: [{ ...EMPTY_CARGO_ITEM, id: generateCargoId() }],
      vehicleId: '',
      driverId: '',
      startTime: '',
    },
  })

  const {
    register,
    handleSubmit,
    control,
    watch,
    trigger,
    setValue,
    setError,
    getValues,
    formState: { errors },
  } = form

  const cargoWatch = watch('cargo')
  const startTimeWatch = watch('startTime')
  const selectedVehicleId = watch('vehicleId')
  const selectedDriverId = watch('driverId')

  const setCargoItems = useCallback(
    (items: CargoItemDraft[]) => {
      setValue('cargo', items, { shouldValidate: true })
    },
    [setValue],
  )

  return {
    register,
    handleSubmit,
    control,
    watch,
    trigger,
    setValue,
    setError,
    getValues,
    errors,
    cargoWatch: cargoWatch ?? [],
    startTimeWatch,
    selectedVehicleId,
    selectedDriverId,
    setCargoItems,
  }
}
