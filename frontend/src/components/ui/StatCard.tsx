type StatCardProps = {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        {icon ? <span className="text-slate-700">{icon}</span> : null}
        <p>{label}</p>
      </div>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  )
}
