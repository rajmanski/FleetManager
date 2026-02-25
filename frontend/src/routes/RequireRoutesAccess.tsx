import type { ReactElement } from 'react'
import { Navigate } from 'react-router-dom'
import { getStoredRole } from '@/services/authStorage'

type RequireRoutesAccessProps = {
  children: ReactElement
}

export function RequireRoutesAccess({ children }: RequireRoutesAccessProps) {
  const role = getStoredRole()
  if (role !== 'Administrator' && role !== 'Spedytor') {
    return <Navigate to="/" replace />
  }
  return children
}
