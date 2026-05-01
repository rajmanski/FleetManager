type PageHeaderProps = {
  title: string
  description: string
  action?: React.ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-gray-900 md:text-2xl">{title}</h2>
        <p className="text-gray-600">{description}</p>
      </div>
      {action && <div className="w-full sm:w-auto [&>button]:w-full sm:[&>button]:w-auto">{action}</div>}
    </div>
  )
}
