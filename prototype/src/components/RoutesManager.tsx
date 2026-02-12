import { useState } from 'react';
import { Plus, Search, Edit, Trash2, MapPin, Navigation } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Badge } from './ui/badge';

interface RoutePoint {
  address: string;
  type: 'pickup' | 'delivery' | 'waypoint';
  arrivalTime?: string;
}

interface Route {
  id: string;
  routeName: string;
  orderNumber: string;
  vehicle: string;
  driver: string;
  totalDistance: number;
  estimatedDuration: number;
  status: 'planned' | 'active' | 'completed';
  startDate: string;
  points: RoutePoint[];
}

const initialRoutes: Route[] = [
  {
    id: '1',
    routeName: 'Warszawa - Berlin',
    orderNumber: 'ZL-2025-0142',
    vehicle: 'Scania R450 (WW 12345)',
    driver: 'Jan Nowak',
    totalDistance: 570,
    estimatedDuration: 7,
    status: 'active',
    startDate: '2025-11-20',
    points: [
      { address: 'Warszawa, ul. Marszałkowska 1', type: 'pickup', arrivalTime: '08:00' },
      { address: 'Frankfurt (Oder)', type: 'waypoint', arrivalTime: '11:00' },
      { address: 'Berlin, Unter den Linden 10', type: 'delivery', arrivalTime: '15:00' },
    ],
  },
  {
    id: '2',
    routeName: 'Poznań - Hamburg',
    orderNumber: 'ZL-2025-0143',
    vehicle: 'Volvo FH16 (GD 98765)',
    driver: 'Piotr Wiśniewski',
    totalDistance: 410,
    estimatedDuration: 5,
    status: 'active',
    startDate: '2025-11-19',
    points: [
      { address: 'Poznań, ul. Święty Marcin 5', type: 'pickup', arrivalTime: '06:00' },
      { address: 'Hamburg, Hafen Straße 25', type: 'delivery', arrivalTime: '11:00' },
    ],
  },
  {
    id: '3',
    routeName: 'Kraków - Praha',
    orderNumber: 'ZL-2025-0144',
    vehicle: 'MAN TGX (PO 54321)',
    driver: 'Anna Kowalska',
    totalDistance: 540,
    estimatedDuration: 6,
    status: 'planned',
    startDate: '2025-11-21',
    points: [
      { address: 'Kraków, ul. Floriańska 20', type: 'pickup', arrivalTime: '07:00' },
      { address: 'Katowice', type: 'waypoint', arrivalTime: '08:30' },
      { address: 'Praha, Václavské náměstí 15', type: 'delivery', arrivalTime: '13:00' },
    ],
  },
];

export function RoutesManager() {
  const [routes, setRoutes] = useState<Route[]>(initialRoutes);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [formData, setFormData] = useState<Partial<Route>>({});

  const filteredRoutes = routes.filter(route =>
    route.routeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.driver.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setEditingRoute(null);
    setFormData({
      status: 'planned',
      points: [
        { address: '', type: 'pickup', arrivalTime: '' },
        { address: '', type: 'delivery', arrivalTime: '' },
      ],
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (route: Route) => {
    setEditingRoute(route);
    setFormData(route);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingRoute) {
      setRoutes(routes.map(r => r.id === editingRoute.id ? { ...r, ...formData } as Route : r));
    } else {
      const newRoute: Route = {
        ...formData,
        id: Date.now().toString(),
      } as Route;
      setRoutes([...routes, newRoute]);
    }
    setIsDialogOpen(false);
    setFormData({});
  };

  const handleDelete = (id: string) => {
    if (confirm('Czy na pewno chcesz usunąć tę trasę?')) {
      setRoutes(routes.filter(r => r.id !== id));
    }
  };

  const addRoutePoint = () => {
    setFormData({
      ...formData,
      points: [...(formData.points || []), { address: '', type: 'waypoint', arrivalTime: '' }],
    });
  };

  const updateRoutePoint = (index: number, field: keyof RoutePoint, value: string) => {
    const newPoints = [...(formData.points || [])];
    newPoints[index] = { ...newPoints[index], [field]: value };
    setFormData({ ...formData, points: newPoints });
  };

  const removeRoutePoint = (index: number) => {
    setFormData({
      ...formData,
      points: (formData.points || []).filter((_, i) => i !== index),
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      planned: { label: 'Zaplanowana', variant: 'outline' as const },
      active: { label: 'Aktywna', variant: 'default' as const },
      completed: { label: 'Zakończona', variant: 'secondary' as const },
    };
    return statusMap[status as keyof typeof statusMap];
  };

  const getPointIcon = (type: string) => {
    return type === 'pickup' ? 'text-green-600' :
           type === 'delivery' ? 'text-red-600' : 'text-blue-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Planowanie tras</h2>
          <p className="text-gray-600">Zarządzaj trasami i punktami przeładunkowymi</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="size-4" />
          Nowa trasa
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
            <Input
              placeholder="Szukaj po nazwie trasy, numerze zlecenia lub kierowcy..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Routes List */}
      <div className="space-y-4">
        {filteredRoutes.map((route) => {
          const statusInfo = getStatusBadge(route.status);
          return (
            <Card key={route.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <Navigation className="size-5 text-blue-600" />
                      <h3>{route.routeName}</h3>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">Zlecenie: {route.orderNumber}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(route)}>
                      <Edit className="size-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(route.id)}>
                      <Trash2 className="size-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Route Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pojazd:</span>
                      <span className="text-gray-900">{route.vehicle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kierowca:</span>
                      <span className="text-gray-900">{route.driver}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dystans:</span>
                      <span className="text-gray-900">{route.totalDistance} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Czas jazdy:</span>
                      <span className="text-gray-900">{route.estimatedDuration} h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Data rozpoczęcia:</span>
                      <span className="text-gray-900">{route.startDate}</span>
                    </div>
                  </div>

                  {/* Route Points */}
                  <div className="lg:col-span-2">
                    <p className="text-sm text-gray-600 mb-3">Punkty trasy:</p>
                    <div className="space-y-3">
                      {route.points.map((point, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <MapPin className={`size-5 ${getPointIcon(point.type)}`} />
                            {index < route.points.length - 1 && (
                              <div className="w-0.5 h-8 bg-gray-300 my-1" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {point.type === 'pickup' ? 'Załadunek' :
                                 point.type === 'delivery' ? 'Rozładunek' : 'Punkt pośredni'}
                              </Badge>
                              {point.arrivalTime && (
                                <span className="text-xs text-gray-600">ETA: {point.arrivalTime}</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-900 mt-1">{point.address}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRoute ? 'Edytuj trasę' : 'Nowa trasa'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nazwa trasy</Label>
                <Input
                  value={formData.routeName || ''}
                  onChange={(e) => setFormData({ ...formData, routeName: e.target.value })}
                  placeholder="np. Warszawa - Berlin"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Numer zlecenia</Label>
                <Input
                  value={formData.orderNumber || ''}
                  onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                  placeholder="np. ZL-2025-0142"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Pojazd</Label>
                <Input
                  value={formData.vehicle || ''}
                  onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                  placeholder="np. Scania R450 (WW 12345)"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Kierowca</Label>
                <Input
                  value={formData.driver || ''}
                  onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
                  placeholder="np. Jan Nowak"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Całkowity dystans (km)</Label>
                <Input
                  type="number"
                  value={formData.totalDistance || ''}
                  onChange={(e) => setFormData({ ...formData, totalDistance: parseInt(e.target.value) })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Szacowany czas (h)</Label>
                <Input
                  type="number"
                  value={formData.estimatedDuration || ''}
                  onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Data rozpoczęcia</Label>
                <Input
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Route['status'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="planned">Zaplanowana</option>
                  <option value="active">Aktywna</option>
                  <option value="completed">Zakończona</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label>Punkty trasy</Label>
                <Button type="button" variant="outline" size="sm" onClick={addRoutePoint}>
                  <Plus className="size-4 mr-2" />
                  Dodaj punkt
                </Button>
              </div>

              {(formData.points || []).map((point, index) => (
                <div key={index} className="flex gap-3 p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <select
                      value={point.type}
                      onChange={(e) => updateRoutePoint(index, 'type', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="pickup">Załadunek</option>
                      <option value="delivery">Rozładunek</option>
                      <option value="waypoint">Punkt pośredni</option>
                    </select>
                    <Input
                      value={point.address}
                      onChange={(e) => updateRoutePoint(index, 'address', e.target.value)}
                      placeholder="Adres"
                      className="col-span-1"
                    />
                    <Input
                      type="time"
                      value={point.arrivalTime || ''}
                      onChange={(e) => updateRoutePoint(index, 'arrivalTime', e.target.value)}
                      placeholder="Godzina przyjazdu"
                    />
                  </div>
                  {(formData.points || []).length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRoutePoint(index)}
                    >
                      <Trash2 className="size-4 text-red-600" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleSave}>
              {editingRoute ? 'Zapisz zmiany' : 'Utwórz trasę'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
