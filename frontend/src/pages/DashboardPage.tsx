import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  BarChart3,
  CircleDollarSign,
  IdCard,
  ShieldAlert,
  Truck,
  Wrench,
} from 'lucide-react'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { useDashboardKpi } from '@/hooks/dashboard/useDashboardKpi'
import type { DashboardAlert } from '@/types/dashboard'
import { formatPrice } from '@/utils/price'

function DashboardPage() {
  const kpiQuery = useDashboardKpi()

  const revenue = kpiQuery.data?.current_month_revenue ?? 0
  const costs = kpiQuery.data?.current_month_costs ?? 0
  const biggerValue = Math.max(revenue, costs, 1)
  const revenueBarWidth = `${(revenue / biggerValue) * 100}%`
  const costsBarWidth = `${(costs / biggerValue) * 100}%`

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of operational KPIs and upcoming alerts."
      />

      {kpiQuery.isLoading && <LoadingMessage message="Loading dashboard KPI..." />}
      {kpiQuery.isError && (
        <ErrorMessage message="Could not load dashboard data. Please try again." />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active orders"
          value={kpiQuery.data?.active_orders ?? '-'}
          icon={<Truck className="size-4" aria-hidden="true" />}
        />
        <StatCard
          label="Vehicles in service"
          value={kpiQuery.data?.vehicles_in_service ?? '-'}
          icon={<Wrench className="size-4" aria-hidden="true" />}
        />
        <StatCard
          label="Current month costs"
          value={kpiQuery.data ? formatPrice(kpiQuery.data.current_month_costs) : '-'}
          icon={<CircleDollarSign className="size-4" aria-hidden="true" />}
        />
        <StatCard
          label="Current month revenue"
          value={kpiQuery.data ? formatPrice(kpiQuery.data.current_month_revenue) : '-'}
          icon={<BarChart3 className="size-4" aria-hidden="true" />}
        />
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-slate-700" aria-hidden="true" />
          <h3 className="text-base font-semibold text-gray-900">Revenue vs costs (current month)</h3>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Quick visual comparison of monthly revenue and costs.
        </p>
        <div className="mt-4 space-y-4">
          <ChartRow
            label="Revenue"
            value={formatPrice(revenue)}
            width={revenueBarWidth}
            barClassName="bg-emerald-500"
          />
          <ChartRow
            label="Costs"
            value={formatPrice(costs)}
            width={costsBarWidth}
            barClassName="bg-amber-500"
          />
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-slate-700" aria-hidden="true" />
            <h3 className="text-base font-semibold text-gray-900">Upcoming alerts (30 days)</h3>
          </div>
          <span className="text-sm text-gray-500">{kpiQuery.data?.alerts.length ?? 0} alerts</span>
        </div>
        {kpiQuery.data && kpiQuery.data.alerts.length === 0 && (
          <p className="mt-4 text-sm text-gray-600">No alerts for the next 30 days.</p>
        )}
        {kpiQuery.data && kpiQuery.data.alerts.length > 0 && (
          <ul className="mt-4 space-y-3">
            {kpiQuery.data.alerts.map((alert, index) => (
              <li key={`${alert.type}-${index}`}>
                <Link
                  to={alertDetailsPath(alert)}
                  className="group block rounded-md border border-gray-200 p-3 transition-colors hover:border-slate-300 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                  aria-label={`Open details for alert: ${alert.message}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <AlertIcon type={alert.type} />
                      <p className="text-sm text-gray-900">{alert.message}</p>
                    </div>
                    <span className="text-sm font-medium text-slate-700 transition-colors group-hover:text-slate-900 group-focus-visible:text-slate-900">
                      Open details
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

type ChartRowProps = {
  label: string
  value: string
  width: string
  barClassName: string
}

function ChartRow({ label, value, width, barClassName }: ChartRowProps) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="font-medium text-gray-900">{value}</span>
      </div>
      <div className="h-3 w-full rounded-full bg-gray-100">
        <div className={`h-3 rounded-full ${barClassName}`} style={{ width }} />
      </div>
    </div>
  )
}

function alertDetailsPath(alert: DashboardAlert): string {
  switch (alert.type) {
    case 'insurance_expiry':
      return '/insurance'
    case 'inspection_due':
      return '/maintenance'
    case 'license_expiry':
    case 'adr_expiry':
      return '/drivers'
    default:
      return '/'
  }
}

function AlertIcon({ type }: { type: DashboardAlert['type'] }) {
  if (type === 'insurance_expiry') {
    return <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
  }

  if (type === 'inspection_due') {
    return <Wrench className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
  }

  if (type === 'license_expiry') {
    return <IdCard className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
  }

  return <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
}

export default DashboardPage
