import { Link } from 'react-router-dom'
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active orders" value={kpiQuery.data?.active_orders ?? '-'} />
        <StatCard label="Vehicles in service" value={kpiQuery.data?.vehicles_in_service ?? '-'} />
        <StatCard
          label="Current month costs"
          value={kpiQuery.data ? formatPrice(kpiQuery.data.current_month_costs) : '-'}
        />
        <StatCard
          label="Current month revenue"
          value={kpiQuery.data ? formatPrice(kpiQuery.data.current_month_revenue) : '-'}
        />
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-base font-semibold text-gray-900">Revenue vs costs (current month)</h3>
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
          <h3 className="text-base font-semibold text-gray-900">Upcoming alerts (30 days)</h3>
          <span className="text-sm text-gray-500">{kpiQuery.data?.alerts.length ?? 0} alerts</span>
        </div>
        {kpiQuery.data && kpiQuery.data.alerts.length === 0 && (
          <p className="mt-4 text-sm text-gray-600">No alerts for the next 30 days.</p>
        )}
        {kpiQuery.data && kpiQuery.data.alerts.length > 0 && (
          <ul className="mt-4 space-y-3">
            {kpiQuery.data.alerts.map((alert, index) => (
              <li key={`${alert.type}-${index}`} className="rounded-md border border-gray-200 p-3">
                <p className="text-sm text-gray-900">{alert.message}</p>
                <Link
                  to={alertDetailsPath(alert)}
                  className="mt-2 inline-block text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  Open details
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
    case 'certificate_expiry':
      return '/drivers'
    default:
      return '/'
  }
}

export default DashboardPage
