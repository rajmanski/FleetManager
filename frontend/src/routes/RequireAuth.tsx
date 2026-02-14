import type { ReactElement } from 'react'
import { Navigate } from 'react-router-dom'
import { getAccessToken } from '@/services/authStorage'

type RequireAuthProps = {
  children: ReactElement
}

function RequireAuth({ children }: RequireAuthProps) {
  if (!getAccessToken()) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default RequireAuth
