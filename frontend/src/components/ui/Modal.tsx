import { useEffect } from 'react'

type ModalProps = {
  title: string
  children: React.ReactNode
  contentClassName?: string
  error?: string | null
  onClose?: () => void
}

export function Modal({ title, children, contentClassName, error, onClose }: ModalProps) {
  useEffect(() => {
    if (!onClose) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 max-md:items-stretch md:p-4">
      <div
        className={`w-full overflow-y-auto overflow-x-hidden border border-gray-200 bg-white p-4 shadow-lg max-md:max-h-full max-md:rounded-none md:max-h-[90vh] md:rounded-lg md:p-6 ${contentClassName ?? 'md:max-w-md'}`}
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
