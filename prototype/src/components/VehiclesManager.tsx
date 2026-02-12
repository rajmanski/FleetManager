import { useState } from 'react';
import { Plus, Search, Edit, Trash2, FileText } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';

interface Vehicle {
  id: string;
  vin: string;
  brand: string;
  model: string;
  year: number;
  capacity: number;
  mileage: number;
  registrationNumber: string;
  status: 'active' | 'maintenance' | 'inactive';
  lastService: string;
  nextService: string;
}

const initialVehicles: Vehicle[] = [
  {
    id: '1',
    vin: 'WVWZZZ1KZBW123456',
    brand: 'Scania',
    model: 'R450',
    year: 2020,
    capacity: 24000,
    mileage: 245000,
    registrationNumber: 'WW 12345',
    status: 'active',
    lastService: '2025-10-15',
    nextService: '2025-12-15',
  },
  {
    id: '2',
    vin: 'YV2A22CBXLA123456',
    brand: 'Volvo',
    model: 'FH16',
    year: 2021,
    capacity: 25000,
    mileage: 180000,
    registrationNumber: 'GD 98765',
    status: 'active',
    lastService: '2025-11-01',
    nextService: '2026-01-01',
  },
  {
    id: '3',
    vin: 'WMAN26ZZ5HY123456',
    brand: 'MAN',
    model: 'TGX 18.480',
    year: 2019,
    capacity: 23500,
    mileage: 320000,
    registrationNumber: 'PO 54321',
    status: 'maintenance',
    lastService: '2025-11-10',
    nextService: '2025-11-25',
  },
  {
    id: '4',
    vin: 'WDB9634161L123456',
    brand: 'Mercedes-Benz',
    model: 'Actros 1845',
    year: 2022,
    capacity: 25000,
    mileage: 95000,
    registrationNumber: 'KR 11111',
    status: 'active',
    lastService: '2025-10-20',
    nextService: '2025-12-20',
  },
];

export function VehiclesManager() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState<Partial<Vehicle>>({});

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.vin.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setEditingVehicle(null);
    setFormData({
      status: 'active',
      year: new Date().getFullYear(),
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData(vehicle);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingVehicle) {
      setVehicles(vehicles.map(v => v.id === editingVehicle.id ? { ...v, ...formData } as Vehicle : v));
    } else {
      const newVehicle: Vehicle = {
        ...formData,
        id: Date.now().toString(),
      } as Vehicle;
      setVehicles([...vehicles, newVehicle]);
    }
    setIsDialogOpen(false);
    setFormData({});
  };

  const handleDelete = (id: string) => {
    if (confirm('Czy na pewno chcesz usunąć ten pojazd?')) {
      setVehicles(vehicles.filter(v => v.id !== id));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: 'Aktywny', variant: 'default' as const },
      maintenance: { label: 'Serwis', variant: 'secondary' as const },
      inactive: { label: 'Nieaktywny', variant: 'outline' as const },
    };
    return statusMap[status as keyof typeof statusMap];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Zarządzanie pojazdami</h2>
          <p className="text-gray-600">Przeglądaj i zarządzaj flotą pojazdów</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="size-4" />
          Dodaj pojazd
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
            <Input
              placeholder="Szukaj po marce, modelu, VIN lub nr rejestracyjnym..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredVehicles.map((vehicle) => {
          const statusInfo = getStatusBadge(vehicle.status);
          return (
            <Card key={vehicle.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3>{vehicle.brand} {vehicle.model}</h3>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">{vehicle.registrationNumber}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(vehicle)}>
                      <Edit className="size-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(vehicle.id)}>
                      <Trash2 className="size-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">VIN:</span>
                    <span className="text-gray-900">{vehicle.vin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rok produkcji:</span>
                    <span className="text-gray-900">{vehicle.year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ładowność:</span>
                    <span className="text-gray-900">{vehicle.capacity.toLocaleString()} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Przebieg:</span>
                    <span className="text-gray-900">{vehicle.mileage.toLocaleString()} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ostatni serwis:</span>
                    <span className="text-gray-900">{vehicle.lastService}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Następny serwis:</span>
                    <span className="text-gray-900">{vehicle.nextService}</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-4 gap-2">
                  <FileText className="size-4" />
                  Historia pojazdu
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingVehicle ? 'Edytuj pojazd' : 'Dodaj nowy pojazd'}</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Marka</Label>
              <Input
                value={formData.brand || ''}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="np. Scania"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Model</Label>
              <Input
                value={formData.model || ''}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="np. R450"
              />
            </div>
            
            <div className="space-y-2">
              <Label>VIN</Label>
              <Input
                value={formData.vin || ''}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                placeholder="17-znakowy numer VIN"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Numer rejestracyjny</Label>
              <Input
                value={formData.registrationNumber || ''}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                placeholder="np. WW 12345"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Rok produkcji</Label>
              <Input
                type="number"
                value={formData.year || ''}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Ładowność (kg)</Label>
              <Input
                type="number"
                value={formData.capacity || ''}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Przebieg (km)</Label>
              <Input
                type="number"
                value={formData.mileage || ''}
                onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as Vehicle['status'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktywny</SelectItem>
                  <SelectItem value="maintenance">Serwis</SelectItem>
                  <SelectItem value="inactive">Nieaktywny</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Ostatni serwis</Label>
              <Input
                type="date"
                value={formData.lastService || ''}
                onChange={(e) => setFormData({ ...formData, lastService: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Następny serwis</Label>
              <Input
                type="date"
                value={formData.nextService || ''}
                onChange={(e) => setFormData({ ...formData, nextService: e.target.value })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleSave}>
              {editingVehicle ? 'Zapisz zmiany' : 'Dodaj pojazd'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
