import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { BarChart3, Settings, Truck, Users } from 'lucide-react'
import { getStoredRole } from '@/services/authStorage'
import {
  clearSessionExpiredMessage,
  getSessionExpiredMessage,
  initAuthSessionManagement,
} from '@/services/api'

const formatRole = (role: string | null): string => {
  if (!role) return 'Unknown role'
  if (role === 'Spedytor') return 'Dispatcher'
  if (role === 'Mechanik') return 'Mechanic'
  return role
}

function App() {
  const location = useLocation()
  const role = getStoredRole()
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

  const navItemClass = (active: boolean) =>
    `w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
      active ? 'bg-slate-100 text-slate-700' : 'text-gray-700 hover:bg-gray-50'
    }`

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-700 p-2">
                <Truck className="size-6 text-white" />
              </div>
              <div>
                <h1>FleetManager Pro</h1>
                <p className="text-sm text-gray-600">Fleet management platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm">Current user</p>
                <p className="text-xs text-gray-600">{formatRole(role)}</p>
              </div>
              <button className="rounded-lg p-2 transition-colors hover:bg-gray-100" type="button">
                <Settings className="size-5 text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="min-h-[calc(100vh-73px)] w-64 border-r border-gray-200 bg-white">
          <nav className="space-y-1 p-4">
            <Link to="/" className={navItemClass(location.pathname === '/')}>
              <BarChart3 className="size-5" />
              <span>Dashboard</span>
            </Link>
            {role === 'Administrator' && (
              <Link
                to="/admin/users"
                className={navItemClass(location.pathname.startsWith('/admin/users'))}
              >
                <Users className="size-5" />
                <span>Users</span>
              </Link>
            )}
          </nav>
        </aside>

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
