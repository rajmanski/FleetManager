export type DashboardAlertType = 'insurance_expiry' | 'inspection_due' | 'license_expiry' | 'adr_expiry'

export type DashboardAlert = {
  type: DashboardAlertType
  message: string
}

export type DashboardKpi = {
  active_orders: number
  vehicles_in_service: number
  current_month_costs: number
  current_month_revenue: number
  alerts: DashboardAlert[]
}
