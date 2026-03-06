type CargoTotalsBarProps = {
  totalWeightKg: number
  totalVolumeM3: number
  hasHazardous: boolean
}

export function CargoTotalsBar({
  totalWeightKg,
  totalVolumeM3,
  hasHazardous,
}: CargoTotalsBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-t border-gray-200 pt-3">
      <span className="text-sm text-gray-600">
        Total weight:{' '}
        <strong>
          {totalWeightKg.toLocaleString('pl-PL', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{' '}
          kg
        </strong>
      </span>
      <span className="text-sm text-gray-600">
        Total volume:{' '}
        <strong>
          {totalVolumeM3.toLocaleString('pl-PL', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{' '}
          m³
        </strong>
      </span>
      {hasHazardous && (
        <span className="rounded-md bg-amber-50 px-2 py-1 text-sm text-amber-800">
          ⚠ Requires driver with ADR certificate
        </span>
      )}
    </div>
  )
}
