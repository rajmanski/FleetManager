type ModalProps = {
  title: string
  children: React.ReactNode
  contentClassName?: string
  error?: string | null
}

export function Modal({ title, children, contentClassName, error }: ModalProps) {
  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
      <div
        className={`w-full rounded-lg border border-gray-200 bg-white p-6 shadow-lg ${contentClassName ?? 'max-w-md'}`}
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        {error && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
