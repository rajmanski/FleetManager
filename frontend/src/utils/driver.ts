import type { Driver } from '@/hooks/drivers/useDrivers'
import type { DriverFormValues } from '@/schemas/drivers'

function toDateInputValue(dateStr?: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

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
    license_number: driver.license_number ?? '',
    license_expiry_date: toDateInputValue(driver.license_expiry_date),
    adr_certified: driver.adr_certified ?? false,
    adr_expiry_date: toDateInputValue(driver.adr_expiry_date),
  }
}
