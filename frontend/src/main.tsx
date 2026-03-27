import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import { ToastProvider } from '@/context/ToastContext'
import App from './App.tsx'
import DashboardPage from './pages/DashboardPage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import UsersPage from './pages/UsersPage.tsx'
import VehicleDetailsPage from './pages/VehicleDetailsPage.tsx'
import VehiclesPage from './pages/VehiclesPage.tsx'
import DriversPage from './pages/DriversPage.tsx'
import ClientsPage from './pages/ClientsPage.tsx'
import OrdersPage from './pages/OrdersPage.tsx'
import OrderDetailPage from './pages/OrderDetailPage.tsx'
import RoutePlanningPage from './pages/RoutePlanningPage.tsx'
import TripsPage from './pages/TripsPage.tsx'
import TripDetailPage from './pages/TripDetailPage.tsx'
import AssignmentsPage from './pages/AssignmentsPage.tsx'
import MaintenancePage from './pages/MaintenancePage.tsx'
import InsurancePage from './pages/InsurancePage.tsx'
import FuelPage from './pages/FuelPage.tsx'
import CostsPage from './pages/CostsPage.tsx'
import { RequireAdmin } from './routes/RequireAdmin.tsx'
import RequireAuth from './routes/RequireAuth.tsx'
import { RequireRoutesAccess } from './routes/RequireRoutesAccess.tsx'
import { RequireAssignmentsAccess } from './routes/RequireAssignmentsAccess.tsx'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <App />
              </RequireAuth>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route
              path="admin/users"
              element={
                <RequireAdmin>
                  <UsersPage />
                </RequireAdmin>
              }
            />
            <Route path="vehicles" element={<VehiclesPage />} />
            <Route path="vehicles/:id" element={<VehicleDetailsPage />} />
            <Route path="drivers" element={<DriversPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route
              path="assignments"
              element={
                <RequireAssignmentsAccess>
                  <AssignmentsPage />
                </RequireAssignmentsAccess>
              }
            />
            <Route
              path="orders"
              element={
                <RequireRoutesAccess>
                  <OrdersPage />
                </RequireRoutesAccess>
              }
            />
            <Route
              path="trips"
              element={
                <RequireRoutesAccess>
                  <TripsPage />
                </RequireRoutesAccess>
              }
            />
            <Route
              path="trips/:id"
              element={
                <RequireRoutesAccess>
                  <TripDetailPage />
                </RequireRoutesAccess>
              }
            />
            <Route
              path="orders/:id"
              element={
                <RequireRoutesAccess>
                  <OrderDetailPage />
                </RequireRoutesAccess>
              }
            />
            <Route
              path="routes"
              element={
                <RequireRoutesAccess>
                  <RoutePlanningPage />
                </RequireRoutesAccess>
              }
            />
            <Route path="maintenance" element={<MaintenancePage />} />
            <Route path="insurance" element={<InsurancePage />} />
            <Route path="fuel" element={<FuelPage />} />
            <Route path="costs" element={<CostsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
