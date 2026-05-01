import type { CalculateResult } from '@/services/routes'
import type { Client } from '@/hooks/clients/useClients'

type OrderPlanningSummarySectionProps = {
  selectedClient: Client | null
  orderNumber: string
  cargoLineCount: number
  totalWeightKg: number
  routeResult: CalculateResult | null
}

export function OrderPlanningSummarySection({
  selectedClient,
  orderNumber,
  cargoLineCount,
  totalWeightKg,
  routeResult,
}: OrderPlanningSummarySectionProps) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-800">Summary</h2>
      <dl className="grid gap-2 text-sm text-gray-700 sm:grid-cols-2">
        <div>
          <dt className="font-medium text-gray-500">Client</dt>
          <dd>{selectedClient?.companyName ?? '—'}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-500">Order number</dt>
          <dd>{orderNumber.trim() || '—'}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-500">Cargo lines</dt>
          <dd>{cargoLineCount}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-500">Total cargo weight</dt>
          <dd>
            {Number.isFinite(totalWeightKg)
              ? `${totalWeightKg.toFixed(1)} kg`
              : '—'}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-gray-500">Route distance</dt>
          <dd>
            {routeResult ? `${routeResult.distance_km.toFixed(1)} km` : '—'}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-gray-500">ETA (driving)</dt>
          <dd>
            {routeResult
              ? `${Math.round(routeResult.duration_minutes)} min`
              : '—'}
          </dd>
        </div>
      </dl>
    </section>
  )
}
