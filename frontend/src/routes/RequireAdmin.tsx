import type { ReactElement } from 'react'
import { Navigate } from 'react-router-dom'
import { getStoredRole } from '@/services/authStorage'

type RequireAdminProps = {
  children: ReactElement
}

export function RequireAdmin({ children }: RequireAdminProps) {
  if (getStoredRole() !== 'Administrator') {
    return <Navigate to="/" replace />
  }

  return children
}
