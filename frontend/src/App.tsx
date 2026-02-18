import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { subscribeToLogout } from '@/services/authStorage'
import {
  clearSessionExpiredMessage,
  getSessionExpiredMessage,
  initAuthSessionManagement,
  logout,
} from '@/services/api'

function App() {
  const navigate = useNavigate()
  const [sessionMessage] = useState<string | null>(() => {
    const message = getSessionExpiredMessage()
    if (message) {
      clearSessionExpiredMessage()
    }
    return message
  })

  useEffect(() => {
    initAuthSessionManagement()
  }, [])

  useEffect(() => {
    return subscribeToLogout(() => {
      navigate('/login', { replace: true })
    })
  }, [navigate])

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader onLogout={handleLogout} />

      <div className="flex">
        <AppSidebar />

        <main className="flex-1 p-6">
          {sessionMessage && (
            <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {sessionMessage}
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default App
