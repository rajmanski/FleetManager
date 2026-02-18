type PageHeaderProps = {
  title: string
  description: string
  action?: React.ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2>{title}</h2>
        <p className="text-gray-600">{description}</p>
      </div>
      {action}
    </div>
  )
}
