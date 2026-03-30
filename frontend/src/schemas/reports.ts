import { z } from 'zod'

export const REPORT_TYPES = [
  'vehicle-profitability',
  'driver-mileage',
  'global-costs',
] as const

export type ReportType = (typeof REPORT_TYPES)[number]

export type ReportsFormValues = {
  reportType: ReportType
  vehicleId: string
  month: string
  driverId: string
  dateFrom: string
  dateTo: string
}

const monthRegex = /^\d{4}-\d{2}$/

function parseYmd(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const d = new Date(`${s}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

function addDateRangeValidationIssues(
  dateFrom: string,
  dateTo: string,
  ctx: z.RefinementCtx,
): void {
  const from = parseYmd(dateFrom.trim())
  const to = parseYmd(dateTo.trim())
  if (!from) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Enter a valid start date',
      path: ['dateFrom'],
    })
  }
  if (!to) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Enter a valid end date',
      path: ['dateTo'],
    })
  }
  if (from && to && from > to) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Start date must be before end date',
      path: ['dateTo'],
    })
  }
}

export const reportsFormSchema = z
  .object({
    reportType: z.enum(REPORT_TYPES),
    vehicleId: z.string(),
    month: z.string(),
    driverId: z.string(),
    dateFrom: z.string(),
    dateTo: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.reportType === 'vehicle-profitability') {
      if (!data.vehicleId.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Select a vehicle',
          path: ['vehicleId'],
        })
      }
      if (!monthRegex.test(data.month.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Select a month',
          path: ['month'],
        })
      }
      return
    }

    if (data.reportType === 'driver-mileage') {
      if (!data.driverId.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Select a driver',
          path: ['driverId'],
        })
      }
      addDateRangeValidationIssues(data.dateFrom, data.dateTo, ctx)
      return
    }

    addDateRangeValidationIssues(data.dateFrom, data.dateTo, ctx)
  })

export function defaultMonthString(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function parseReportsSearchParams(search: URLSearchParams): ReportsFormValues {
  const raw = search.get('report')
  const reportType = REPORT_TYPES.includes(raw as ReportType)
    ? (raw as ReportType)
    : 'vehicle-profitability'

  const monthDefault = defaultMonthString()

  if (reportType === 'vehicle-profitability') {
    return {
      reportType,
      vehicleId: search.get('vehicle_id') ?? '',
      month: search.get('month') ?? monthDefault,
      driverId: '',
      dateFrom: '',
      dateTo: '',
    }
  }

  if (reportType === 'driver-mileage') {
    return {
      reportType,
      vehicleId: '',
      month: '',
      driverId: search.get('driver_id') ?? '',
      dateFrom: search.get('date_from') ?? '',
      dateTo: search.get('date_to') ?? '',
    }
  }

  return {
    reportType,
    vehicleId: '',
    month: '',
    driverId: '',
    dateFrom: search.get('date_from') ?? '',
    dateTo: search.get('date_to') ?? '',
  }
}

export function isReportQueryReady(search: URLSearchParams): boolean {
  const values = parseReportsSearchParams(search)
  return reportsFormSchema.safeParse(values).success
}

export function buildReportsSearchParams(values: ReportsFormValues): URLSearchParams {
  const p = new URLSearchParams()
  p.set('report', values.reportType)

  if (values.reportType === 'vehicle-profitability') {
    p.set('vehicle_id', values.vehicleId.trim())
    p.set('month', values.month.trim())
    return p
  }

  if (values.reportType === 'driver-mileage') {
    p.set('driver_id', values.driverId.trim())
    p.set('date_from', values.dateFrom.trim())
    p.set('date_to', values.dateTo.trim())
    return p
  }

  p.set('date_from', values.dateFrom.trim())
  p.set('date_to', values.dateTo.trim())
  return p
}
