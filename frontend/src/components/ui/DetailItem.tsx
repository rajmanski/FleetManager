type DetailItemProps = {
  label: string
  value: string
}

export function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-800">{value}</dd>
    </div>
  )
}
