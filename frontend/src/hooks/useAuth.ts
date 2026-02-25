import { useMemo } from 'react'
import { getStoredRole } from '@/services/authStorage'

export function useAuth() {
  const role = getStoredRole()
  return useMemo(
    () => ({
      role,
      isAdmin: role === 'Administrator',
      canManageVehicles: role === 'Administrator' || role === 'Mechanik',
      canManageDrivers: role === 'Administrator' || role === 'Mechanik',
      canAccessRoutes: role === 'Administrator' || role === 'Spedytor',
    }),
    [role]
  )
}
