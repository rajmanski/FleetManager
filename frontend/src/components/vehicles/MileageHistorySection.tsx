import { Calendar, Gauge } from 'lucide-react'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { LoadingMessage } from '@/components/ui/LoadingMessage'
import { ThWithIcon } from '@/components/ui/ThWithIcon'
import { formatDateOnly } from '@/utils/date'
import { useVehicleMileageHistory } from '@/hooks/vehicles/useVehicleMileageHistory'

type MileageHistorySectionProps = {
  vehicleId: number
  currentMileageKm: number | undefined
  recordedAt: string | undefined
}

export function MileageHistorySection({
  vehicleId,
  currentMileageKm,
  recordedAt,
}: MileageHistorySectionProps) {
  const { mileageHistoryQuery } = useVehicleMileageHistory(vehicleId)

  const rows = mileageHistoryQuery.data ?? []

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="mb-3 text-base font-semibold text-gray-800">Mileage history</h3>

      {typeof currentMileageKm === 'number' && (
        <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          <p>Current snapshot: {currentMileageKm} km</p>
          <p className="text-xs text-gray-500">Recorded at: {formatDateOnly(recordedAt)}</p>
        </div>
      )}

      {mileageHistoryQuery.isLoading && <LoadingMessage />}
      {mileageHistoryQuery.isError && (
        <ErrorMessage message="Failed to load mileage history." />
      )}

      {mileageHistoryQuery.isSuccess && (
        <>
          {rows.length === 0 ? (
            <p className="text-sm text-gray-500">No mileage history available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <ThWithIcon icon={Calendar}>Date</ThWithIcon>
                    <ThWithIcon icon={Gauge}>Mileage (km)</ThWithIcon>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {rows.map((row, idx) => (
                    <tr key={idx} className="transition-colors hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-3">{formatDateOnly(row.date)}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {row.mileage.toLocaleString('pl-PL')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
