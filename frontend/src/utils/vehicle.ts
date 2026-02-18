import type { Vehicle } from '@/hooks/vehicles/useVehicles'

export type VehicleFormInitialData = {
  vin: string
  plate_number: string
  brand: string
  model: string
  production_year: number
  capacity_kg: string
  current_mileage_km: number
}

export function vehicleToFormInitialData(vehicle: Vehicle): VehicleFormInitialData {
  return {
    vin: vehicle.vin,
    plate_number: vehicle.plate_number ?? '',
    brand: vehicle.brand ?? '',
    model: vehicle.model ?? '',
    production_year: vehicle.production_year ?? new Date().getFullYear(),
    capacity_kg: vehicle.capacity_kg?.toString() ?? '',
    current_mileage_km: vehicle.current_mileage_km ?? 0,
  }
}
