import type { Driver } from '@/hooks/drivers/useDrivers'
import type { DriverFormValues } from '@/schemas/drivers'

export type CertificateStatus = 'valid' | 'expiring' | 'expired'

export function getCertificateStatus(driver: Driver): CertificateStatus {
  const now = new Date()
  const in30Days = new Date(now)
  in30Days.setDate(in30Days.getDate() + 30)

  let worstStatus: CertificateStatus = 'valid'

  const checkDate = (dateStr: string | undefined) => {
    if (!dateStr) return
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return
    if (d < now) worstStatus = 'expired'
    else if (d <= in30Days && worstStatus === 'valid') worstStatus = 'expiring'
  }

  checkDate(driver.license_expiry_date)
  if (driver.adr_certified) {
    checkDate(driver.adr_expiry_date)
  }

  return worstStatus
}

export function getCertificateTooltip(driver: Driver): string {
  const parts: string[] = []
  const now = new Date()
  const in30Days = new Date(now)
  in30Days.setDate(in30Days.getDate() + 30)

  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  if (driver.license_expiry_date) {
    const d = new Date(driver.license_expiry_date)
    if (!Number.isNaN(d.getTime())) {
      if (d < now) parts.push(`License expired ${fmt(d)}`)
      else if (d <= in30Days) parts.push(`License expires ${fmt(d)}`)
      else parts.push(`License valid until ${fmt(d)}`)
    }
  }

  if (driver.adr_certified) {
    if (driver.adr_expiry_date) {
      const d = new Date(driver.adr_expiry_date)
      if (!Number.isNaN(d.getTime())) {
        if (d < now) parts.push(`ADR expired ${fmt(d)}`)
        else if (d <= in30Days) parts.push(`ADR expires ${fmt(d)}`)
        else parts.push(`ADR valid until ${fmt(d)}`)
      }
    } else {
      parts.push('ADR certificate (no expiry date)')
    }
  }

  return parts.length > 0 ? parts.join('\n') : 'No certificate data'
}

export function hasValidCertificates(driver: Driver): boolean {
  const status = getCertificateStatus(driver)
  return status === 'valid' || status === 'expiring'
}

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
