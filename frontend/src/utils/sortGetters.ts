import type { Driver } from '@/hooks/drivers/useDrivers'
import type { Vehicle } from '@/hooks/vehicles/useVehicles'
import type { Client } from '@/hooks/clients/useClients'
import type { Order } from '@/hooks/orders/useOrders'
import type { Trip } from '@/hooks/trips/useTrips'
import type { Maintenance } from '@/hooks/maintenance/useMaintenance'
import type { InsurancePolicy } from '@/hooks/insurance/useInsurance'
import type { FuelLog } from '@/hooks/fuel/useFuel'
import type { Cost } from '@/hooks/costs/useCosts'
import type { AdminUser } from '@/hooks/users/useUsers'
import type { Assignment } from '@/hooks/assignments/useAssignments'
import type { ChangelogEntry } from '@/hooks/changelog/useChangelog'
import type { Notification } from '@/types/notifications'
import type { SortValueGetter } from '@/hooks/useSortable'

export const driverSortGetter: SortValueGetter<Driver> = (driver, column) => {
  switch (column) {
    case 'last_name':
      return `${driver.last_name} ${driver.first_name}`
    case 'pesel':
      return driver.pesel
    case 'status':
      return driver.status
    case 'adr_certified':
      return driver.adr_certified ? 1 : 0
    default:
      return null
  }
}

export const vehicleSortGetter: SortValueGetter<Vehicle> = (vehicle, column) => {
  switch (column) {
    case 'vin':
      return vehicle.vin
    case 'brand':
      return vehicle.brand ?? ''
    case 'model':
      return vehicle.model ?? ''
    case 'production_year':
      return vehicle.production_year ?? 0
    case 'current_mileage_km':
      return vehicle.current_mileage_km ?? 0
    case 'status':
      return vehicle.status
    default:
      return null
  }
}

export const clientSortGetter: SortValueGetter<Client> = (client, column) => {
  switch (column) {
    case 'companyName':
      return client.companyName
    case 'nip':
      return client.nip
    case 'address':
      return client.address ?? ''
    case 'contactEmail':
      return client.contactEmail ?? ''
    default:
      return null
  }
}

export const orderSortGetter: SortValueGetter<Order> = (order, column) => {
  switch (column) {
    case 'id':
      return order.id
    case 'orderNumber':
      return order.orderNumber
    case 'clientCompany':
      return order.clientCompany ?? ''
    case 'status':
      return order.status
    case 'deliveryDeadline':
      return order.deliveryDeadline ?? ''
    case 'totalPricePln':
      return order.totalPricePln ?? 0
    default:
      return null
  }
}

export const tripSortGetter: SortValueGetter<Trip> = (trip, column) => {
  switch (column) {
    case 'id':
      return trip.id
    case 'order_number':
      return trip.order_number
    case 'client_company':
      return trip.client_company ?? ''
    case 'vehicle_vin':
      return trip.vehicle_vin
    case 'driver_name':
      return trip.driver_name ?? ''
    case 'status':
      return trip.status
    case 'start_time':
      return trip.start_time ?? ''
    case 'end_time':
      return trip.end_time ?? ''
    default:
      return null
  }
}

export const maintenanceSortGetter: SortValueGetter<Maintenance> = (row, column) => {
  switch (column) {
    case 'vehicleId':
      return row.vehicleId
    case 'type':
      return row.type
    case 'status':
      return row.status
    case 'startDate':
      return row.startDate ?? ''
    default:
      return null
  }
}

export const insuranceSortGetter: SortValueGetter<InsurancePolicy> = (row, column) => {
  switch (column) {
    case 'vehicleId':
      return row.vehicleId
    case 'type':
      return row.type
    case 'policyNumber':
      return row.policyNumber
    case 'cost':
      return row.cost
    case 'endDate':
      return row.endDate
    default:
      return null
  }
}

export const fuelSortGetter: SortValueGetter<FuelLog> = (row, column) => {
  switch (column) {
    case 'vehicle_id':
      return row.vehicle_id
    case 'date':
      return row.date
    case 'liters':
      return row.liters
    case 'total_cost':
      return row.total_cost
    case 'mileage':
      return row.mileage
    default:
      return null
  }
}

export const costSortGetter: SortValueGetter<Cost> = (row, column) => {
  switch (column) {
    case 'vehicleId':
      return row.vehicleId
    case 'category':
      return row.category
    case 'amount':
      return row.amount
    case 'date':
      return row.date
    default:
      return null
  }
}

export const userSortGetter: SortValueGetter<AdminUser> = (user, column) => {
  switch (column) {
    case 'login':
      return user.login
    case 'email':
      return user.email
    case 'role':
      return user.role
    case 'is_active':
      return user.is_active ? 1 : 0
    default:
      return null
  }
}

export const assignmentSortGetter: SortValueGetter<Assignment> = (a, column) => {
  switch (column) {
    case 'assignment_id':
      return a.assignment_id
    case 'vehicle_vin':
      return a.vehicle_vin
    case 'driver_name':
      return a.driver_name ?? ''
    case 'assigned_from':
      return a.assigned_from ?? ''
    case 'assigned_to':
      return a.assigned_to ?? ''
    default:
      return null
  }
}

export const changelogSortGetter: SortValueGetter<ChangelogEntry> = (row, column) => {
  switch (column) {
    case 'timestamp':
      return row.timestamp
    case 'username':
      return row.username ?? ''
    case 'tableName':
      return row.tableName
    case 'recordId':
      return row.recordId
    case 'operation':
      return row.operation
    default:
      return null
  }
}

export const notificationSortGetter: SortValueGetter<Notification> = (row, column) => {
  switch (column) {
    case 'type':
      return row.type
    case 'message':
      return row.message ?? ''
    case 'created_at':
      return row.created_at ?? ''
    case 'is_read':
      return row.is_read ? 1 : 0
    default:
      return null
  }
}
