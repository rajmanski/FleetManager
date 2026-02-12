import { Truck, Users, FileText, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const stats = [
  { label: 'Aktywne pojazdy', value: '24', icon: Truck, trend: '+2 w tym miesiącu', color: 'bg-blue-500' },
  { label: 'Kierowcy', value: '32', icon: Users, trend: '+3 w tym miesiącu', color: 'bg-green-500' },
  { label: 'Zlecenia w toku', value: '18', icon: FileText, trend: '6 zakończonych dziś', color: 'bg-orange-500' },
  { label: 'Koszty (mies.)', value: '124 500 zł', icon: DollarSign, trend: '-8% vs ubiegły', color: 'bg-purple-500' },
];

const fuelData = [
  { month: 'Sty', koszt: 42000 },
  { month: 'Lut', koszt: 38000 },
  { month: 'Mar', koszt: 45000 },
  { month: 'Kwi', koszt: 41000 },
  { month: 'Maj', koszt: 39000 },
  { month: 'Cze', koszt: 43000 },
];

const ordersData = [
  { month: 'Sty', zlecenia: 45 },
  { month: 'Lut', zlecenia: 52 },
  { month: 'Mar', zlecenia: 48 },
  { month: 'Kwi', zlecenia: 61 },
  { month: 'Maj', zlecenia: 55 },
  { month: 'Cze', zlecenia: 58 },
];

const recentAlerts = [
  { id: 1, type: 'warning', message: 'Przegląd techniczny – MAN TGX 456 – za 5 dni', vehicle: 'MAN TGX 456' },
  { id: 2, type: 'danger', message: 'Ubezpieczenie OC – Volvo FH16 789 – za 2 dni', vehicle: 'Volvo FH16 789' },
  { id: 3, type: 'warning', message: 'Wymiana oleju – Scania R450 123 – za 1000 km', vehicle: 'Scania R450 123' },
  { id: 4, type: 'info', message: 'Przegląd kabiny – Mercedes Actros 321 – za 15 dni', vehicle: 'Mercedes Actros 321' },
];

const activeOrders = [
  { id: 1, order: 'ZL-2025-0142', vehicle: 'Scania R450', driver: 'Jan Nowak', route: 'Warszawa → Berlin', status: 'W trasie' },
  { id: 2, order: 'ZL-2025-0143', vehicle: 'Volvo FH16', driver: 'Piotr Wiśniewski', route: 'Poznań → Hamburg', status: 'W trasie' },
  { id: 3, order: 'ZL-2025-0144', vehicle: 'MAN TGX', driver: 'Anna Kowalska', route: 'Kraków → Praga', status: 'Załadunek' },
  { id: 4, order: 'ZL-2025-0145', vehicle: 'Mercedes Actros', driver: 'Tomasz Zieliński', route: 'Gdańsk → Rotterdam', status: 'W trasie' },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2>Dashboard</h2>
        <p className="text-gray-600">Przegląd stanu floty i bieżących operacji</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">{stat.label}</p>
                    <p className="mt-2">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.trend}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="size-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Koszty paliwa (ostatnie 6 miesięcy)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={fuelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="koszt" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Realizacja zleceń</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={ordersData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="zlecenia" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Active Orders and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Zlecenia w realizacji</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-900">{order.order}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'W trasie' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{order.vehicle} • {order.driver}</p>
                    <p className="text-xs text-gray-500 mt-1">{order.route}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alerty i powiadomienia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
                  <div className={`p-2 rounded-lg ${
                    alert.type === 'danger' ? 'bg-red-100' :
                    alert.type === 'warning' ? 'bg-orange-100' : 'bg-blue-100'
                  }`}>
                    <AlertTriangle className={`size-4 ${
                      alert.type === 'danger' ? 'text-red-600' :
                      alert.type === 'warning' ? 'text-orange-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
