import type { ReactElement } from 'react'
import { Navigate } from 'react-router-dom'
import { getStoredRole } from '@/services/authStorage'

type RequireAssignmentsAccessProps = {
  children: ReactElement
}

export function RequireAssignmentsAccess({ children }: RequireAssignmentsAccessProps) {
  const role = getStoredRole()
  if (role !== 'Administrator' && role !== 'Mechanik') {
    return <Navigate to="/" replace />
  }
  return children
}

