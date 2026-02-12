import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Phone, Mail, Car } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  licenseNumber: string;
  licenseExpiry: string;
  licenseCategories: string[];
  status: 'available' | 'on-route' | 'off-duty';
  assignedVehicle?: string;
  hireDate: string;
}

const initialDrivers: Driver[] = [
  {
    id: '1',
    firstName: 'Jan',
    lastName: 'Nowak',
    phone: '+48 600 123 456',
    email: 'jan.nowak@example.com',
    licenseNumber: 'NOW123456',
    licenseExpiry: '2028-06-15',
    licenseCategories: ['C', 'C+E'],
    status: 'on-route',
    assignedVehicle: 'Scania R450 (WW 12345)',
    hireDate: '2018-03-15',
  },
  {
    id: '2',
    firstName: 'Piotr',
    lastName: 'Wiśniewski',
    phone: '+48 601 234 567',
    email: 'piotr.wisniewski@example.com',
    licenseNumber: 'WIS234567',
    licenseExpiry: '2027-11-20',
    licenseCategories: ['C', 'C+E'],
    status: 'on-route',
    assignedVehicle: 'Volvo FH16 (GD 98765)',
    hireDate: '2019-07-01',
  },
  {
    id: '3',
    firstName: 'Anna',
    lastName: 'Kowalska',
    phone: '+48 602 345 678',
    email: 'anna.kowalska@example.com',
    licenseNumber: 'KOW345678',
    licenseExpiry: '2029-02-10',
    licenseCategories: ['C', 'C+E', 'D'],
    status: 'available',
    assignedVehicle: 'MAN TGX (PO 54321)',
    hireDate: '2020-01-10',
  },
  {
    id: '4',
    firstName: 'Tomasz',
    lastName: 'Zieliński',
    phone: '+48 603 456 789',
    email: 'tomasz.zielinski@example.com',
    licenseNumber: 'ZIE456789',
    licenseExpiry: '2026-09-05',
    licenseCategories: ['C', 'C+E'],
    status: 'on-route',
    assignedVehicle: 'Mercedes Actros (KR 11111)',
    hireDate: '2017-05-20',
  },
];

export function DriversManager() {
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [formData, setFormData] = useState<Partial<Driver>>({});

  const filteredDrivers = drivers.filter(driver =>
    driver.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.phone.includes(searchTerm) ||
    driver.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setEditingDriver(null);
    setFormData({
      status: 'available',
      licenseCategories: [],
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData(driver);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingDriver) {
      setDrivers(drivers.map(d => d.id === editingDriver.id ? { ...d, ...formData } as Driver : d));
    } else {
      const newDriver: Driver = {
        ...formData,
        id: Date.now().toString(),
      } as Driver;
      setDrivers([...drivers, newDriver]);
    }
    setIsDialogOpen(false);
    setFormData({});
  };

  const handleDelete = (id: string) => {
    if (confirm('Czy na pewno chcesz usunąć tego kierowcę?')) {
      setDrivers(drivers.filter(d => d.id !== id));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      available: { label: 'Dostępny', variant: 'default' as const },
      'on-route': { label: 'W trasie', variant: 'secondary' as const },
      'off-duty': { label: 'Wolny', variant: 'outline' as const },
    };
    return statusMap[status as keyof typeof statusMap];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Zarządzanie kierowcami</h2>
          <p className="text-gray-600">Przeglądaj i zarządzaj bazą kierowców</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="size-4" />
          Dodaj kierowcę
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
            <Input
              placeholder="Szukaj po imieniu, nazwisku, telefonie lub e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Drivers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredDrivers.map((driver) => {
          const statusInfo = getStatusBadge(driver.status);
          return (
            <Card key={driver.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <span className="text-blue-700">{driver.firstName[0]}{driver.lastName[0]}</span>
                    </div>
                    <div>
                      <h3>{driver.firstName} {driver.lastName}</h3>
                      <Badge variant={statusInfo.variant} className="mt-1">{statusInfo.label}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(driver)}>
                      <Edit className="size-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(driver.id)}>
                      <Trash2 className="size-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="size-4" />
                    <span>{driver.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="size-4" />
                    <span>{driver.email}</span>
                  </div>
                  {driver.assignedVehicle && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Car className="size-4" />
                      <span>{driver.assignedVehicle}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600">Prawo jazdy:</p>
                      <p className="text-gray-900">{driver.licenseNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Ważne do:</p>
                      <p className="text-gray-900">{driver.licenseExpiry}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Kategorie:</p>
                      <div className="flex gap-1 mt-1">
                        {driver.licenseCategories.map((cat) => (
                          <Badge key={cat} variant="outline">{cat}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600">Data zatrudnienia:</p>
                      <p className="text-gray-900">{driver.hireDate}</p>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingDriver ? 'Edytuj kierowcę' : 'Dodaj nowego kierowcę'}</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Imię</Label>
              <Input
                value={formData.firstName || ''}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Nazwisko</Label>
              <Input
                value={formData.lastName || ''}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+48 600 000 000"
              />
            </div>
            
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Numer prawa jazdy</Label>
              <Input
                value={formData.licenseNumber || ''}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Ważność prawa jazdy</Label>
              <Input
                type="date"
                value={formData.licenseExpiry || ''}
                onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as Driver['status'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Dostępny</SelectItem>
                  <SelectItem value="on-route">W trasie</SelectItem>
                  <SelectItem value="off-duty">Wolny</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Data zatrudnienia</Label>
              <Input
                type="date"
                value={formData.hireDate || ''}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
              />
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label>Przypisany pojazd</Label>
              <Input
                value={formData.assignedVehicle || ''}
                onChange={(e) => setFormData({ ...formData, assignedVehicle: e.target.value })}
                placeholder="np. Scania R450 (WW 12345)"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleSave}>
              {editingDriver ? 'Zapisz zmiany' : 'Dodaj kierowcę'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
