import {
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  Fuel,
  MapPin,
  Shield,
  Truck,
  Users,
  UserCircle,
  Wrench,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function AppSidebar() {
  const location = useLocation()
  const { role, canAccessRoutes, canAccessAssignments } = useAuth()

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
          to="/notifications"
          className={navItemClass(location.pathname.startsWith('/notifications'))}
        >
          <Bell className="size-5" />
          <span>Notifications</span>
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
        {canAccessAssignments && (
          <Link
            to="/assignments"
            className={navItemClass(location.pathname.startsWith('/assignments'))}
          >
            <Users className="size-5" />
            <span>Assignments</span>
          </Link>
        )}
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
          <>
            <Link
              to="/orders"
              className={navItemClass(location.pathname.startsWith('/orders'))}
            >
              <ClipboardList className="size-5" />
              <span>Orders</span>
            </Link>
            <Link
              to="/trips"
              className={navItemClass(location.pathname.startsWith('/trips'))}
            >
              <Truck className="size-5" />
              <span>Trips</span>
            </Link>
            <Link
              to="/routes"
              className={navItemClass(location.pathname.startsWith('/routes'))}
            >
              <MapPin className="size-5" />
              <span>Routes</span>
            </Link>
            <Link
              to="/reports"
              className={navItemClass(location.pathname.startsWith('/reports'))}
            >
              <FileSpreadsheet className="size-5" />
              <span>Reports</span>
            </Link>
          </>
        )}
        <Link
          to="/maintenance"
          className={navItemClass(location.pathname.startsWith('/maintenance'))}
        >
          <Wrench className="size-5" />
          <span>Maintenance</span>
        </Link>
        <Link
          to="/insurance"
          className={navItemClass(location.pathname.startsWith('/insurance'))}
        >
          <Shield className="size-5" />
          <span>Insurance</span>
        </Link>
        <Link
          to="/fuel"
          className={navItemClass(location.pathname.startsWith('/fuel'))}
        >
          <Fuel className="size-5" />
          <span>Fuel logs</span>
        </Link>
        <Link to="/costs" className={navItemClass(location.pathname.startsWith('/costs'))}>
          <FileText className="size-5" />
          <span>Costs</span>
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
  )
}
