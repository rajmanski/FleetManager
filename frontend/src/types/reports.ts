export type VehicleProfitabilityReport = {
  vehicle_id: number
  month: string
  revenue: number
  costs: {
    fuel: number
    maintenance: number
    insurance: number
    tolls: number
    total: number
  }
  profit: number
}

export type DriverMileageReport = {
  driver_id: number
  period: string
  total_km: number
  orders_count: number
}

export type GlobalCostsReport = {
  period: string
  costs_by_category: {
    fuel: number
    maintenance: number
    insurance: number
    tolls: number
    other: number
  }
  total: number
}

export type ReportFetchResult =
  | { kind: 'vehicle-profitability'; data: VehicleProfitabilityReport }
  | { kind: 'driver-mileage'; data: DriverMileageReport }
  | { kind: 'global-costs'; data: GlobalCostsReport }
