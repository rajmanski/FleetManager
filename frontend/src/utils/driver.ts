import type { Driver } from '@/hooks/drivers/useDrivers'
import type { DriverFormValues } from '@/schemas/drivers'

export function driverToFormInitialData(driver: Driver): DriverFormValues {
  const status =
    driver.status === 'Available' || driver.status === 'OnLeave' || driver.status === 'InRoute'
      ? driver.status
      : 'Available'
  return {
    first_name: driver.first_name,
    last_name: driver.last_name,
    pesel: driver.pesel,
    phone: driver.phone ?? '',
    email: driver.email ?? '',
    status,
  }
}
