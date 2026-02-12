import { useState } from 'react';
import { FileText, Download, Filter, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const fuelConsumptionData = [
  { vehicle: 'Scania R450', avg: 28.5, month: 32.1 },
  { vehicle: 'Volvo FH16', avg: 29.2, month: 30.5 },
  { vehicle: 'MAN TGX', avg: 30.1, month: 31.8 },
  { vehicle: 'Mercedes Actros', avg: 27.8, month: 29.2 },
];

const mileageData = [
  { month: 'Sty', total: 48500 },
  { month: 'Lut', total: 52000 },
  { month: 'Mar', total: 49800 },
  { month: 'Kwi', total: 56200 },
  { month: 'Maj', total: 54100 },
  { month: 'Cze', total: 57800 },
];

const vehicleUtilization = [
  { vehicle: 'Scania R450', utilization: 92 },
  { vehicle: 'Volvo FH16', utilization: 88 },
  { vehicle: 'MAN TGX', utilization: 75 },
  { vehicle: 'Mercedes Actros', utilization: 85 },
];

const driverPerformance = [
  { driver: 'Jan Nowak', orders: 28, distance: 12500, fuelEff: 28.2 },
  { driver: 'Piotr Wiśniewski', orders: 32, distance: 14200, fuelEff: 29.1 },
  { driver: 'Anna Kowalska', orders: 24, distance: 10800, fuelEff: 30.5 },
  { driver: 'Tomasz Zieliński', orders: 26, distance: 11900, fuelEff: 27.8 },
];

const revenueVsCosts = [
  { month: 'Sty', przychody: 185000, koszty: 58700 },
  { month: 'Lut', przychody: 192000, koszty: 58100 },
  { month: 'Mar', przychody: 178000, koszty: 60000 },
  { month: 'Kwi', przychody: 205000, koszty: 58500 },
  { month: 'Maj', przychody: 198000, koszty: 55200 },
  { month: 'Cze', przychody: 212000, koszty: 63100 },
];

export function ReportsPanel() {
  const [reportType, setReportType] = useState('summary');
  const [timeRange, setTimeRange] = useState('month');
  const [selectedVehicle, setSelectedVehicle] = useState('all');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Raporty i analizy</h2>
          <p className="text-gray-600">Szczegółowe raporty operacyjne i finansowe</p>
        </div>
        <Button className="gap-2">
          <Download className="size-4" />
          Eksportuj raport
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="text-sm text-gray-600 mb-2 block">Okres</Label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Ostatni tydzień</SelectItem>
                  <SelectItem value="month">Ostatni miesiąc</SelectItem>
                  <SelectItem value="quarter">Ostatni kwartał</SelectItem>
                  <SelectItem value="year">Ostatni rok</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="text-sm text-gray-600 mb-2 block">Pojazd</Label>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie pojazdy</SelectItem>
                  <SelectItem value="scania">Scania R450</SelectItem>
                  <SelectItem value="volvo">Volvo FH16</SelectItem>
                  <SelectItem value="man">MAN TGX</SelectItem>
                  <SelectItem value="mercedes">Mercedes Actros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="text-sm text-gray-600 mb-2 block">Typ raportu</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Podsumowanie</SelectItem>
                  <SelectItem value="costs">Analiza kosztów</SelectItem>
                  <SelectItem value="efficiency">Efektywność</SelectItem>
                  <SelectItem value="performance">Wydajność kierowców</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Całkowity przebieg</p>
                <p className="mt-2">318 400 km</p>
                <div className="flex items-center gap-1 mt-2 text-green-600">
                  <TrendingUp className="size-4" />
                  <span className="text-xs">+8% vs ubiegły</span>
                </div>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="size-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Śr. spalanie</p>
                <p className="mt-2">29.1 L/100km</p>
                <div className="flex items-center gap-1 mt-2 text-green-600">
                  <TrendingDown className="size-4" />
                  <span className="text-xs">-3% vs ubiegły</span>
                </div>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingDown className="size-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Wykorzystanie floty</p>
                <p className="mt-2">85%</p>
                <div className="flex items-center gap-1 mt-2 text-green-600">
                  <TrendingUp className="size-4" />
                  <span className="text-xs">+5% vs ubiegły</span>
                </div>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <TrendingUp className="size-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Koszt na km</p>
                <p className="mt-2">1.85 zł</p>
                <div className="flex items-center gap-1 mt-2 text-red-600">
                  <TrendingUp className="size-4" />
                  <span className="text-xs">+2% vs ubiegły</span>
                </div>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Calendar className="size-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="mileage">
        <TabsList>
          <TabsTrigger value="mileage">Przebieg</TabsTrigger>
          <TabsTrigger value="fuel">Spalanie</TabsTrigger>
          <TabsTrigger value="utilization">Wykorzystanie</TabsTrigger>
          <TabsTrigger value="financial">Finanse</TabsTrigger>
        </TabsList>

        <TabsContent value="mileage" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Całkowity przebieg floty</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mileageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Przebieg (km)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fuel" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Średnie spalanie według pojazdów</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={fuelConsumptionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="vehicle" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avg" fill="#10b981" name="Średnia (L/100km)" />
                  <Bar dataKey="month" fill="#3b82f6" name="Obecny miesiąc (L/100km)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="utilization" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Wykorzystanie pojazdów (%)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={vehicleUtilization} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="vehicle" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="utilization" fill="#f59e0b" name="Wykorzystanie (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Przychody vs Koszty</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueVsCosts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="przychody" stroke="#10b981" strokeWidth={2} name="Przychody" />
                  <Line type="monotone" dataKey="koszty" stroke="#ef4444" strokeWidth={2} name="Koszty" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Driver Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Wydajność kierowców (ostatni miesiąc)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm text-gray-600">Kierowca</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-600">Zrealizowane zlecenia</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-600">Przebieg (km)</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-600">Śr. spalanie (L/100km)</th>
                  <th className="text-right py-3 px-4 text-sm text-gray-600">Efektywność</th>
                </tr>
              </thead>
              <tbody>
                {driverPerformance.map((driver, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm text-gray-900">{driver.driver}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">{driver.orders}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">{driver.distance.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">{driver.fuelEff}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        driver.fuelEff < 29 ? 'bg-green-100 text-green-700' :
                        driver.fuelEff < 30 ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {driver.fuelEff < 29 ? 'Wysoka' : driver.fuelEff < 30 ? 'Średnia' : 'Do poprawy'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
