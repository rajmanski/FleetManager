import { useState } from 'react';
import { Plus, Search, Edit, Trash2, MapPin, Package } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';

interface Order {
  id: string;
  orderNumber: string;
  clientName: string;
  clientPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  distance: number;
  cargoType: string;
  cargoWeight: number;
  assignedVehicle?: string;
  assignedDriver?: string;
  status: 'pending' | 'assigned' | 'in-progress' | 'delivered' | 'cancelled';
  price: number;
  createdDate: string;
  deliveryDate: string;
  notes?: string;
}

const initialOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'ZL-2025-0142',
    clientName: 'ABC Logistics Sp. z o.o.',
    clientPhone: '+48 22 123 4567',
    pickupAddress: 'Warszawa, ul. Marszałkowska 1',
    deliveryAddress: 'Berlin, Unter den Linden 10',
    distance: 570,
    cargoType: 'Palety z elektroniką',
    cargoWeight: 18000,
    assignedVehicle: 'Scania R450 (WW 12345)',
    assignedDriver: 'Jan Nowak',
    status: 'in-progress',
    price: 4500,
    createdDate: '2025-11-18',
    deliveryDate: '2025-11-21',
    notes: 'Dostawa na godzinę 10:00, wymagane dokumenty celne',
  },
  {
    id: '2',
    orderNumber: 'ZL-2025-0143',
    clientName: 'TransEuro Sp. z o.o.',
    clientPhone: '+48 61 234 5678',
    pickupAddress: 'Poznań, ul. Święty Marcin 5',
    deliveryAddress: 'Hamburg, Hafen Straße 25',
    distance: 410,
    cargoType: 'Materiały budowlane',
    cargoWeight: 22000,
    assignedVehicle: 'Volvo FH16 (GD 98765)',
    assignedDriver: 'Piotr Wiśniewski',
    status: 'in-progress',
    price: 3800,
    createdDate: '2025-11-19',
    deliveryDate: '2025-11-21',
  },
  {
    id: '3',
    orderNumber: 'ZL-2025-0144',
    clientName: 'Polski Handel Sp. z o.o.',
    clientPhone: '+48 12 345 6789',
    pickupAddress: 'Kraków, ul. Floriańska 20',
    deliveryAddress: 'Praha, Václavské náměstí 15',
    distance: 540,
    cargoType: 'Meble biurowe',
    cargoWeight: 15000,
    assignedVehicle: 'MAN TGX (PO 54321)',
    assignedDriver: 'Anna Kowalska',
    status: 'assigned',
    price: 4200,
    createdDate: '2025-11-20',
    deliveryDate: '2025-11-23',
  },
  {
    id: '4',
    orderNumber: 'ZL-2025-0145',
    clientName: 'Morska Spedycja',
    clientPhone: '+48 58 456 7890',
    pickupAddress: 'Gdańsk, ul. Portowa 10',
    deliveryAddress: 'Rotterdam, Havenkade 50',
    distance: 1100,
    cargoType: 'Kontenery',
    cargoWeight: 24000,
    assignedVehicle: 'Mercedes Actros (KR 11111)',
    assignedDriver: 'Tomasz Zieliński',
    status: 'in-progress',
    price: 7200,
    createdDate: '2025-11-19',
    deliveryDate: '2025-11-24',
  },
  {
    id: '5',
    orderNumber: 'ZL-2025-0146',
    clientName: 'Fast Cargo Sp. z o.o.',
    clientPhone: '+48 71 567 8901',
    pickupAddress: 'Wrocław, ul. Świdnicka 15',
    deliveryAddress: 'Dresden, Prager Straße 30',
    distance: 280,
    cargoType: 'Tekstylia',
    cargoWeight: 12000,
    status: 'pending',
    price: 2800,
    createdDate: '2025-11-20',
    deliveryDate: '2025-11-22',
  },
];

export function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState<Partial<Order>>({});

  const filteredOrders = orders.filter(order =>
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.pickupAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setEditingOrder(null);
    setFormData({
      status: 'pending',
      orderNumber: `ZL-2025-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setFormData(order);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingOrder) {
      setOrders(orders.map(o => o.id === editingOrder.id ? { ...o, ...formData } as Order : o));
    } else {
      const newOrder: Order = {
        ...formData,
        id: Date.now().toString(),
      } as Order;
      setOrders([...orders, newOrder]);
    }
    setIsDialogOpen(false);
    setFormData({});
  };

  const handleDelete = (id: string) => {
    if (confirm('Czy na pewno chcesz usunąć to zlecenie?')) {
      setOrders(orders.filter(o => o.id !== id));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: 'Oczekujące', variant: 'outline' as const },
      assigned: { label: 'Przypisane', variant: 'secondary' as const },
      'in-progress': { label: 'W realizacji', variant: 'default' as const },
      delivered: { label: 'Dostarczone', variant: 'default' as const },
      cancelled: { label: 'Anulowane', variant: 'outline' as const },
    };
    return statusMap[status as keyof typeof statusMap];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>Zarządzanie zleceniami</h2>
          <p className="text-gray-600">Przeglądaj i zarządzaj zleceniami transportowymi</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="size-4" />
          Nowe zlecenie
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
            <Input
              placeholder="Szukaj po numerze zlecenia, kliencie lub adresie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const statusInfo = getStatusBadge(order.status);
          return (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3>{order.orderNumber}</h3>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </div>
                    <p className="text-gray-600 mt-1">{order.clientName}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(order)}>
                      <Edit className="size-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(order.id)}>
                      <Trash2 className="size-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <MapPin className="size-4 text-green-600" />
                        <span>Załadunek</span>
                      </div>
                      <p className="text-sm text-gray-900 ml-6">{order.pickupAddress}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <MapPin className="size-4 text-red-600" />
                        <span>Rozładunek</span>
                      </div>
                      <p className="text-sm text-gray-900 ml-6">{order.deliveryAddress}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Package className="size-4 text-gray-400" />
                      <span className="text-gray-600">Ładunek:</span>
                      <span className="text-gray-900">{order.cargoType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Waga:</span>
                      <span className="text-gray-900">{order.cargoWeight.toLocaleString()} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dystans:</span>
                      <span className="text-gray-900">{order.distance} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cena:</span>
                      <span className="text-gray-900">{order.price.toLocaleString()} zł</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {order.assignedVehicle && (
                      <div>
                        <span className="text-gray-600">Pojazd:</span>
                        <p className="text-gray-900">{order.assignedVehicle}</p>
                      </div>
                    )}
                    {order.assignedDriver && (
                      <div>
                        <span className="text-gray-600">Kierowca:</span>
                        <p className="text-gray-900">{order.assignedDriver}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Data utworzenia:</span>
                      <p className="text-gray-900">{order.createdDate}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Termin dostawy:</span>
                      <p className="text-gray-900">{order.deliveryDate}</p>
                    </div>
                  </div>
                </div>

                {order.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">Uwagi:</p>
                    <p className="text-sm text-gray-900 mt-1">{order.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOrder ? 'Edytuj zlecenie' : 'Nowe zlecenie transportowe'}</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Numer zlecenia</Label>
              <Input
                value={formData.orderNumber || ''}
                onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                readOnly
              />
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as Order['status'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Oczekujące</SelectItem>
                  <SelectItem value="assigned">Przypisane</SelectItem>
                  <SelectItem value="in-progress">W realizacji</SelectItem>
                  <SelectItem value="delivered">Dostarczone</SelectItem>
                  <SelectItem value="cancelled">Anulowane</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Nazwa klienta</Label>
              <Input
                value={formData.clientName || ''}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Telefon klienta</Label>
              <Input
                value={formData.clientPhone || ''}
                onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                placeholder="+48 22 123 4567"
              />
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label>Adres załadunku</Label>
              <Input
                value={formData.pickupAddress || ''}
                onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
              />
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label>Adres rozładunku</Label>
              <Input
                value={formData.deliveryAddress || ''}
                onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Typ ładunku</Label>
              <Input
                value={formData.cargoType || ''}
                onChange={(e) => setFormData({ ...formData, cargoType: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Waga ładunku (kg)</Label>
              <Input
                type="number"
                value={formData.cargoWeight || ''}
                onChange={(e) => setFormData({ ...formData, cargoWeight: parseInt(e.target.value) })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Dystans (km)</Label>
              <Input
                type="number"
                value={formData.distance || ''}
                onChange={(e) => setFormData({ ...formData, distance: parseInt(e.target.value) })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Cena (zł)</Label>
              <Input
                type="number"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Przypisany pojazd</Label>
              <Input
                value={formData.assignedVehicle || ''}
                onChange={(e) => setFormData({ ...formData, assignedVehicle: e.target.value })}
                placeholder="np. Scania R450 (WW 12345)"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Przypisany kierowca</Label>
              <Input
                value={formData.assignedDriver || ''}
                onChange={(e) => setFormData({ ...formData, assignedDriver: e.target.value })}
                placeholder="np. Jan Nowak"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Data utworzenia</Label>
              <Input
                type="date"
                value={formData.createdDate || ''}
                onChange={(e) => setFormData({ ...formData, createdDate: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Termin dostawy</Label>
              <Input
                type="date"
                value={formData.deliveryDate || ''}
                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
              />
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label>Uwagi</Label>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Dodatkowe informacje o zleceniu..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={handleSave}>
              {editingOrder ? 'Zapisz zmiany' : 'Utwórz zlecenie'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
