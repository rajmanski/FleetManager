import { formatDateTime } from '@/utils/date'

type MileageHistorySectionProps = {
  currentMileageKm: number | undefined
  recordedAt: string | undefined
}

export function MileageHistorySection({
  currentMileageKm,
  recordedAt,
}: MileageHistorySectionProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="mb-3 text-base font-semibold text-gray-800">Mileage history</h3>
      {typeof currentMileageKm === 'number' ? (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          <p>Current snapshot: {currentMileageKm} km</p>
          <p className="text-xs text-gray-500">Recorded at: {formatDateTime(recordedAt)}</p>
          <p className="mt-2 text-xs text-gray-500">
            Detailed mileage history is not available yet.
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-500">Mileage history is not available for this vehicle.</p>
      )}
    </div>
  )
}
