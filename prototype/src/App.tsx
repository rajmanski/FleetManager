import { useState } from 'react';
import { Truck, Users, FileText, Route, DollarSign, Bell, BarChart3, Settings } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { VehiclesManager } from './components/VehiclesManager';
import { DriversManager } from './components/DriversManager';
import { OrdersManager } from './components/OrdersManager';
import { RoutesManager } from './components/RoutesManager';
import { CostsMonitor } from './components/CostsMonitor';
import { AlertsPanel } from './components/AlertsPanel';
import { ReportsPanel } from './components/ReportsPanel';

type ViewType = 'dashboard' | 'vehicles' | 'drivers' | 'orders' | 'routes' | 'costs' | 'alerts' | 'reports';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [userRole] = useState<'admin' | 'spedytor' | 'mechanik'>('admin');

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, roles: ['admin', 'spedytor', 'mechanik'] },
    { id: 'vehicles', label: 'Pojazdy', icon: Truck, roles: ['admin', 'mechanik'] },
    { id: 'drivers', label: 'Kierowcy', icon: Users, roles: ['admin', 'spedytor'] },
    { id: 'orders', label: 'Zlecenia', icon: FileText, roles: ['admin', 'spedytor'] },
    { id: 'routes', label: 'Trasy', icon: Route, roles: ['admin', 'spedytor'] },
    { id: 'costs', label: 'Koszty', icon: DollarSign, roles: ['admin'] },
    { id: 'alerts', label: 'Alerty', icon: Bell, roles: ['admin', 'mechanik'] },
    { id: 'reports', label: 'Raporty', icon: BarChart3, roles: ['admin', 'spedytor'] },
  ] as const;

  const filteredNavigation = navigation.filter(item => item.roles.includes(userRole));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Truck className="size-6 text-white" />
              </div>
              <div>
                <h1>FleetManager Pro</h1>
                <p className="text-gray-600 text-sm">System zarządzania flotą</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm">Jan Kowalski</p>
                <p className="text-xs text-gray-600 capitalize">{userRole}</p>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="size-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)]">
          <nav className="p-4 space-y-1">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as ViewType)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    currentView === item.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="size-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {currentView === 'dashboard' && <Dashboard />}
          {currentView === 'vehicles' && <VehiclesManager />}
          {currentView === 'drivers' && <DriversManager />}
          {currentView === 'orders' && <OrdersManager />}
          {currentView === 'routes' && <RoutesManager />}
          {currentView === 'costs' && <CostsMonitor />}
          {currentView === 'alerts' && <AlertsPanel />}
          {currentView === 'reports' && <ReportsPanel />}
        </main>
      </div>
    </div>
  );
}
