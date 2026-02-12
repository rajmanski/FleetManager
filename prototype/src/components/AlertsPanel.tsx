import { useState } from 'react';
import { AlertTriangle, Bell, CheckCircle, XCircle, Calendar, Wrench, Shield, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'service' | 'insurance' | 'license' | 'inspection' | 'other';
  title: string;
  description: string;
  vehicle?: string;
  driver?: string;
  dueDate: string;
  status: 'active' | 'resolved' | 'dismissed';
  createdDate: string;
}

const initialAlerts: Alert[] = [
  {
    id: '1',
    type: 'critical',
    category: 'insurance',
    title: 'Ubezpieczenie OC wygasa',
    description: 'Ubezpieczenie OC wygasa za 2 dni',
    vehicle: 'Volvo FH16 789',
    dueDate: '2025-11-22',
    status: 'active',
    createdDate: '2025-11-15',
  },
  {
    id: '2',
    type: 'warning',
    category: 'service',
    title: 'Przegląd techniczny',
    description: 'Wymagany przegląd techniczny pojazdu',
    vehicle: 'MAN TGX 456',
    dueDate: '2025-11-25',
    status: 'active',
    createdDate: '2025-11-10',
  },
  {
    id: '3',
    type: 'warning',
    category: 'service',
    title: 'Wymiana oleju',
    description: 'Zalecana wymiana oleju za 1000 km',
    vehicle: 'Scania R450 123',
    dueDate: '2025-11-28',
    status: 'active',
    createdDate: '2025-11-18',
  },
  {
    id: '4',
    type: 'info',
    category: 'inspection',
    title: 'Przegląd kabiny',
    description: 'Okresowy przegląd kabiny i wyposażenia',
    vehicle: 'Mercedes Actros 321',
    dueDate: '2025-12-05',
    status: 'active',
    createdDate: '2025-11-19',
  },
  {
    id: '5',
    type: 'warning',
    category: 'license',
    title: 'Uprawnienia kierowcy',
    description: 'Prawo jazdy wygasa za 3 miesiące',
    driver: 'Tomasz Zieliński',
    dueDate: '2026-02-05',
    status: 'active',
    createdDate: '2025-11-01',
  },
  {
    id: '6',
    type: 'critical',
    category: 'service',
    title: 'Usterka techniczna',
    description: 'Zgłoszony problem z układem hamulcowym',
    vehicle: 'MAN TGX 456',
    dueDate: '2025-11-21',
    status: 'active',
    createdDate: '2025-11-20',
  },
  {
    id: '7',
    type: 'info',
    category: 'insurance',
    title: 'Odnowienie AC',
    description: 'Przypomnienie o odnowieniu ubezpieczenia AC',
    vehicle: 'Scania R450 123',
    dueDate: '2025-12-15',
    status: 'resolved',
    createdDate: '2025-10-15',
  },
];

export function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [activeTab, setActiveTab] = useState('active');

  const handleResolve = (id: string) => {
    setAlerts(alerts.map(alert =>
      alert.id === id ? { ...alert, status: 'resolved' as const } : alert
    ));
  };

  const handleDismiss = (id: string) => {
    setAlerts(alerts.map(alert =>
      alert.id === id ? { ...alert, status: 'dismissed' as const } : alert
    ));
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <XCircle className="size-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="size-5 text-orange-600" />;
      case 'info':
        return <Bell className="size-5 text-blue-600" />;
      default:
        return <Bell className="size-5" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'service':
        return <Wrench className="size-4" />;
      case 'insurance':
        return <Shield className="size-4" />;
      case 'license':
        return <FileText className="size-4" />;
      case 'inspection':
        return <Calendar className="size-4" />;
      default:
        return <Bell className="size-4" />;
    }
  };

  const getAlertBgColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-orange-50 border-orange-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      service: 'Serwis',
      insurance: 'Ubezpieczenie',
      license: 'Uprawnienia',
      inspection: 'Przegląd',
      other: 'Inne',
    };
    return labels[category] || category;
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date('2025-11-20');
    const due = new Date(dueDate);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const filteredAlerts = alerts.filter(alert => {
    if (activeTab === 'all') return true;
    return alert.status === activeTab;
  });

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const criticalCount = activeAlerts.filter(a => a.type === 'critical').length;
  const warningCount = activeAlerts.filter(a => a.type === 'warning').length;

  return (
    <div className="space-y-6">
      <div>
        <h2>Alerty i powiadomienia</h2>
        <p className="text-gray-600">Monitorowanie ważnych wydarzeń i terminów</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-3 rounded-lg">
                <XCircle className="size-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Krytyczne</p>
                <p className="text-gray-900">{criticalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-3 rounded-lg">
                <AlertTriangle className="size-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Ostrzeżenia</p>
                <p className="text-gray-900">{warningCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="size-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Rozwiązane</p>
                <p className="text-gray-900">{alerts.filter(a => a.status === 'resolved').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista alertów</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="active">Aktywne ({activeAlerts.length})</TabsTrigger>
              <TabsTrigger value="resolved">Rozwiązane</TabsTrigger>
              <TabsTrigger value="all">Wszystkie</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6 space-y-3">
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  <Bell className="size-12 mx-auto mb-3 text-gray-400" />
                  <p>Brak alertów w tej kategorii</p>
                </div>
              ) : (
                filteredAlerts.map((alert) => {
                  const daysUntil = getDaysUntilDue(alert.dueDate);
                  return (
                    <div
                      key={alert.id}
                      className={`p-4 border rounded-lg ${getAlertBgColor(alert.type)}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 pt-1">
                          {getAlertIcon(alert.type)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-sm">{alert.title}</h3>
                                <Badge variant="outline" className="text-xs">
                                  <span className="mr-1">{getCategoryIcon(alert.category)}</span>
                                  {getCategoryLabel(alert.category)}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-700">{alert.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-gray-600 mt-3">
                            {alert.vehicle && (
                              <div className="flex items-center gap-1">
                                <span>Pojazd:</span>
                                <span className="text-gray-900">{alert.vehicle}</span>
                              </div>
                            )}
                            {alert.driver && (
                              <div className="flex items-center gap-1">
                                <span>Kierowca:</span>
                                <span className="text-gray-900">{alert.driver}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="size-3" />
                              <span>Termin: {alert.dueDate}</span>
                              {daysUntil <= 7 && daysUntil >= 0 && (
                                <Badge variant="destructive" className="ml-2 text-xs">
                                  Za {daysUntil} dni
                                </Badge>
                              )}
                              {daysUntil < 0 && (
                                <Badge variant="destructive" className="ml-2 text-xs">
                                  Przekroczono termin
                                </Badge>
                              )}
                            </div>
                          </div>

                          {alert.status === 'active' && (
                            <div className="flex gap-2 mt-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResolve(alert.id)}
                                className="text-xs"
                              >
                                <CheckCircle className="size-3 mr-1" />
                                Oznacz jako rozwiązane
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDismiss(alert.id)}
                                className="text-xs"
                              >
                                Odrzuć
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>Nadchodzące terminy (najbliższe 30 dni)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {alerts
              .filter(a => a.status === 'active' && getDaysUntilDue(a.dueDate) <= 30 && getDaysUntilDue(a.dueDate) >= 0)
              .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
              .map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="size-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-900">{alert.title}</p>
                      <p className="text-xs text-gray-600">{alert.vehicle || alert.driver}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">{alert.dueDate}</p>
                    <p className="text-xs text-gray-600">Za {getDaysUntilDue(alert.dueDate)} dni</p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
