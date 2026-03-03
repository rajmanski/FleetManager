import { BarChart3, Building2, MapPin, Truck, Users, UserCircle } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function AppSidebar() {
  const location = useLocation()
  const { role, canAccessRoutes } = useAuth()

  const navItemClass = (active: boolean) =>
    `w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
      active ? 'bg-slate-100 text-slate-700' : 'text-gray-700 hover:bg-gray-50'
    }`

  return (
    <aside className="min-h-[calc(100vh-73px)] w-64 border-r border-gray-200 bg-white">
      <nav className="space-y-1 p-4">
        <Link to="/" className={navItemClass(location.pathname === '/')}>
          <BarChart3 className="size-5" />
          <span>Dashboard</span>
        </Link>
        <Link
          to="/vehicles"
          className={navItemClass(location.pathname.startsWith('/vehicles'))}
        >
          <Truck className="size-5" />
          <span>Vehicles</span>
        </Link>
        <Link
          to="/drivers"
          className={navItemClass(location.pathname.startsWith('/drivers'))}
        >
          <UserCircle className="size-5" />
          <span>Drivers</span>
        </Link>
        {(role === 'Administrator' || role === 'Spedytor') && (
          <Link
            to="/clients"
            className={navItemClass(location.pathname.startsWith('/clients'))}
          >
            <Building2 className="size-5" />
            <span>Clients</span>
          </Link>
        )}
        {canAccessRoutes && (
          <Link
            to="/routes"
            className={navItemClass(location.pathname.startsWith('/routes'))}
          >
            <MapPin className="size-5" />
            <span>Routes</span>
          </Link>
        )}
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
  )
}
