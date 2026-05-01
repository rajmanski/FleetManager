import { LogOut, Menu, Truck } from 'lucide-react'
import { NotificationBellMenu } from '@/components/notifications/NotificationBellMenu'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { formatRole } from '@/utils/role'

type AppHeaderProps = {
  onLogout: () => void
  onToggleSidebar: () => void
}

export function AppHeader({ onLogout, onToggleSidebar }: AppHeaderProps) {
  const { role } = useAuth()

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="rounded-md p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
              aria-label="Otwórz menu"
            >
              <Menu className="size-5" />
            </button>
            <div className="rounded-lg bg-slate-700 p-2">
              <Truck className="size-5 md:size-6 text-white" />
            </div>
            <div>
              <h1 className="text-base md:text-lg">FleetManager Pro</h1>
              <p className="text-xs md:text-sm text-gray-600">Fleet management platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <NotificationBellMenu />
            <div className="hidden text-right sm:block">
              <p className="text-sm">Current user</p>
              <p className="text-xs text-gray-600">{formatRole(role)}</p>
            </div>
            <Button
              variant="ghost"
              type="button"
              onClick={() => void onLogout()}
              className="rounded-lg p-2 hover:bg-gray-100"
            >
              <LogOut className="size-5 text-gray-700" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
