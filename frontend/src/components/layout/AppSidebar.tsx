import {
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  Fuel,
  Shield,
  Truck,
  Users,
  UserCircle,
  Wrench,
  X,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

type AppSidebarProps = {
  open: boolean
  onClose: () => void
}

export function AppSidebar({ open, onClose }: AppSidebarProps) {
  const location = useLocation()
  const { role, canAccessRoutes, canAccessAssignments } = useAuth()

  const navItemClass = (active: boolean) =>
    `w-full flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
      active ? 'bg-slate-100 text-slate-700' : 'text-gray-700 hover:bg-gray-50'
    }`

  const handleNav = () => {
    onClose()
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out lg:static lg:z-auto lg:min-h-[calc(100vh-73px)] lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-slate-700 p-1.5">
              <Truck className="size-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-800">Menu</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Zamknij menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="space-y-1 overflow-y-auto p-4" style={{ height: 'calc(100% - 49px)' }}>
          <Link to="/" className={navItemClass(location.pathname === '/')} onClick={handleNav}>
            <BarChart3 className="size-5" />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/notifications"
            className={navItemClass(location.pathname.startsWith('/notifications'))}
            onClick={handleNav}
          >
            <Bell className="size-5" />
            <span>Notifications</span>
          </Link>
          <Link
            to="/vehicles"
            className={navItemClass(location.pathname.startsWith('/vehicles'))}
            onClick={handleNav}
          >
            <Truck className="size-5" />
            <span>Vehicles</span>
          </Link>
          <Link
            to="/drivers"
            className={navItemClass(location.pathname.startsWith('/drivers'))}
            onClick={handleNav}
          >
            <UserCircle className="size-5" />
            <span>Drivers</span>
          </Link>
          {canAccessAssignments && (
            <Link
              to="/assignments"
              className={navItemClass(location.pathname.startsWith('/assignments'))}
              onClick={handleNav}
            >
              <Users className="size-5" />
              <span>Assignments</span>
            </Link>
          )}
          {(role === 'Administrator' || role === 'Spedytor') && (
            <Link
              to="/clients"
              className={navItemClass(location.pathname.startsWith('/clients'))}
              onClick={handleNav}
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
                onClick={handleNav}
              >
                <ClipboardList className="size-5" />
                <span>Orders</span>
              </Link>
              <Link
                to="/trips"
                className={navItemClass(location.pathname.startsWith('/trips'))}
                onClick={handleNav}
              >
                <Truck className="size-5" />
                <span>Trips</span>
              </Link>
              <Link
                to="/reports"
                className={navItemClass(location.pathname.startsWith('/reports'))}
                onClick={handleNav}
              >
                <FileSpreadsheet className="size-5" />
                <span>Reports</span>
              </Link>
            </>
          )}
          <Link
            to="/maintenance"
            className={navItemClass(location.pathname.startsWith('/maintenance'))}
            onClick={handleNav}
          >
            <Wrench className="size-5" />
            <span>Maintenance</span>
          </Link>
          <Link
            to="/insurance"
            className={navItemClass(location.pathname.startsWith('/insurance'))}
            onClick={handleNav}
          >
            <Shield className="size-5" />
            <span>Insurance</span>
          </Link>
          <Link
            to="/fuel"
            className={navItemClass(location.pathname.startsWith('/fuel'))}
            onClick={handleNav}
          >
            <Fuel className="size-5" />
            <span>Fuel logs</span>
          </Link>
          <Link to="/costs" className={navItemClass(location.pathname.startsWith('/costs'))} onClick={handleNav}>
            <FileText className="size-5" />
            <span>Costs</span>
          </Link>
          {role === 'Administrator' && (
            <Link
              to="/admin/users"
              className={navItemClass(location.pathname.startsWith('/admin/users'))}
              onClick={handleNav}
            >
              <Users className="size-5" />
              <span>Users</span>
            </Link>
          )}
          {role === 'Administrator' && (
            <Link
              to="/admin/changelog"
              className={navItemClass(location.pathname.startsWith('/admin/changelog'))}
              onClick={handleNav}
            >
              <FileText className="size-5" />
              <span>Changelog</span>
            </Link>
          )}
          {role === 'Administrator' && (
            <Link
              to="/admin/dictionaries"
              className={navItemClass(location.pathname.startsWith('/admin/dictionaries'))}
              onClick={handleNav}
            >
              <BookOpen className="size-5" />
              <span>Dictionaries</span>
            </Link>
          )}
        </nav>
      </aside>
    </>
  )
}
