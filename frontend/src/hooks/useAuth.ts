import { useMemo, useSyncExternalStore } from 'react'
import { getStoredRole, subscribeToTokenChange } from '@/services/authStorage'

export function useAuth() {
  const role = useSyncExternalStore(subscribeToTokenChange, getStoredRole, () => null)

  return useMemo(
    () => ({
      role,
      isAdmin: role === 'Administrator',
      canManageVehicles: role === 'Administrator' || role === 'Mechanik',
      canManageDrivers: role === 'Administrator' || role === 'Mechanik',
      canAccessRoutes: role === 'Administrator' || role === 'Spedytor',
      canAccessAssignments: role === 'Administrator' || role === 'Mechanik',
      canManageInsurancePolicies: role === 'Administrator' || role === 'Mechanik',
      canManageFuelLogs: role === 'Administrator' || role === 'Mechanik',
    }),
    [role]
  )
}
