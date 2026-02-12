import { useState } from 'react';
import { Plus, DollarSign, Fuel, Wrench, Shield, Navigation } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Badge } from './ui/badge';

interface Cost {
  id: string;
  vehicle: string;
  category: 'fuel' | 'toll' | 'service' | 'insurance' | 'other';
  amount: number;
  date: string;
  description: string;
}

const initialCosts: Cost[] = [
  { id: '1', vehicle: 'Scania R450', category: 'fuel', amount: 1250, date: '2025-11-20', description: 'Tankowanie - 500L' },
  { id: '2', vehicle: 'Volvo FH16', category: 'fuel', amount: 1180, date: '2025-11-20', description: 'Tankowanie - 480L' },
  { id: '3', vehicle: 'MAN TGX', category: 'service', amount: 2500, date: '2025-11-18', description: 'Wymiana oleju i filtrów' },
  { id: '4', vehicle: 'Mercedes Actros', category: 'toll', amount: 340, date: '2025-11-19', description: 'Autostrada A2' },
  { id: '5', vehicle: 'Scania R450', category: 'insurance', amount: 4200, date: '2025-11-15', description: 'OC i AC - roczna składka' },
  { id: '6', vehicle: 'Volvo FH16', category: 'toll', amount: 280, date: '2025-11-19', description: 'Opłaty drogowe DE' },
  { id: '7', vehicle: 'MAN TGX', category: 'fuel', amount: 1100, date: '2025-11-19', description: 'Tankowanie - 450L' },
  { id: '8', vehicle: 'Mercedes Actros', category: 'service', amount: 850, date: '2025-11-17', description: 'Naprawa układu hamulcowego' },
];

const monthlyCosts = [
  { month: 'Sty', paliwo: 42000, serwis: 8500, opłaty: 3200, ubezpieczenia: 5000 },
  { month: 'Lut', paliwo: 38000, serwis: 12000, opłaty: 3100, ubezpieczenia: 5000 },
  { month: 'Mar', paliwo: 45000, serwis: 6500, opłaty: 3500, ubezpieczenia: 5000 },
  { month: 'Kwi', paliwo: 41000, serwis: 9200, opłaty: 3300, ubezpieczenia: 5000 },
  { month: 'Maj', paliwo: 39000, serwis: 7800, opłaty: 3400, ubezpieczenia: 5000 },
  { month: 'Cze', paliwo: 43000, serwis: 11500, opłaty: 3600, ubezpieczenia: 5000 },
];

const costsByCategory = [
  { name: 'Paliwo', value: 248000, color: '#3b82f6' },
  { name: 'Serwis', value: 55500, color: '#10b981' },
  { name: 'Opłaty drogowe', value: 20100, color: '#f59e0b' },
  { name: 'Ubezpieczenia', value: 30000, color: '#8b5cf6' },
];

const costsByVehicle = [
  { vehicle: 'Scania R450', costs: 62500 },
  { vehicle: 'Volvo FH16', costs: 58200 },
  { vehicle: 'MAN TGX', costs: 54800 },
  { vehicle: 'Mercedes Actros', costs: 48100 },
];

export function CostsMonitor() {
  const [costs] = useState<Cost[]>(initialCosts);
  const [timeRange, setTimeRange] = useState('month');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'fuel': return <Fuel className="size-4" />;
      case 'toll': return <Navigation className="size-4" />;
      case 'service': return <Wrench className="size-4" />;
      case 'insurance': return <Shield className="size-4" />;
      default: return <DollarSign className="size-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      fuel: 'Paliwo',
      toll: 'Opłaty drogowe',
      service: 'Serwis',
      insurance: 'Ubezpieczenie',
      other: 'Inne',
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      fuel: 'bg-blue-100 text-blue-700',
      toll: 'bg-orange-100 text-orange-700',
      service: 'bg-green-100 text-green-700',
      insurance: 'bg-purple-100 text-purple-700',
      other: 'bg-gray-100 text-gray-700',
    };
    return colors[category] || colors.other;
  };

  const filteredCosts = selectedCategory === 'all'
    ? costs
    : costs.filter(cost => cost.category === selectedCategory);

  const totalCosts = filteredCosts.reduce((sum, cost) => sum + cost.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Monitorowanie kosztów</h2>
          <p className="text-gray-600">Analiza kosztów operacyjnych floty</p>
        </div>
        <Button className="gap-2">
          <Plus className="size-4" />
          Dodaj koszt
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
              <Label className="text-sm text-gray-600 mb-2 block">Kategoria</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  <SelectItem value="fuel">Paliwo</SelectItem>
                  <SelectItem value="toll">Opłaty drogowe</SelectItem>
                  <SelectItem value="service">Serwis</SelectItem>
                  <SelectItem value="insurance">Ubezpieczenia</SelectItem>
                  <SelectItem value="other">Inne</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Fuel className="size-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Paliwo</p>
                <p className="text-gray-900">248 000 zł</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <Wrench className="size-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Serwis</p>
                <p className="text-gray-900">55 500 zł</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Navigation className="size-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Opłaty drogowe</p>
                <p className="text-gray-900">20 100 zł</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Shield className="size-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Ubezpieczenia</p>
                <p className="text-gray-900">30 000 zł</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Koszty w czasie (ostatnie 6 miesięcy)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyCosts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="paliwo" fill="#3b82f6" name="Paliwo" />
                <Bar dataKey="serwis" fill="#10b981" name="Serwis" />
                <Bar dataKey="opłaty" fill="#f59e0b" name="Opłaty" />
                <Bar dataKey="ubezpieczenia" fill="#8b5cf6" name="Ubezpieczenia" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Podział kosztów według kategorii</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={costsByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {costsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Costs by Vehicle */}
      <Card>
        <CardHeader>
          <CardTitle>Koszty według pojazdów</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={costsByVehicle} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="vehicle" type="category" width={150} />
              <Tooltip />
              <Bar dataKey="costs" fill="#3b82f6" name="Koszty (zł)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Costs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ostatnie koszty</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Suma:</span>
              <span className="text-gray-900">{totalCosts.toLocaleString()} zł</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredCosts.map((cost) => (
              <div key={cost.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${getCategoryColor(cost.category)}`}>
                    {getCategoryIcon(cost.category)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">{cost.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-600">{cost.vehicle}</p>
                      <Badge variant="outline" className="text-xs">
                        {getCategoryLabel(cost.category)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-900">{cost.amount.toLocaleString()} zł</p>
                  <p className="text-xs text-gray-600 mt-1">{cost.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
