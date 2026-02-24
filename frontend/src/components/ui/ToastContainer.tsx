import { CheckCircle2, XCircle } from 'lucide-react'

type Toast = {
  id: number
  type: 'success' | 'error'
  message: string
}

type ToastContainerProps = {
  toasts: Toast[]
  onDismiss: (id: number) => void
}

const config = {
  success: {
    Icon: CheckCircle2,
    className: 'border-green-200 bg-green-50 text-green-800',
    iconClassName: 'text-green-600',
  },
  error: {
    Icon: XCircle,
    className: 'border-red-200 bg-red-50 text-red-800',
    iconClassName: 'text-red-600',
  },
} as const

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => {
        const { Icon, className, iconClassName } = config[toast.type]
        return (
          <div
            key={toast.id}
            role="alert"
            className={`flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg transition-opacity ${className}`}
          >
            <Icon className={`mt-0.5 size-5 shrink-0 ${iconClassName}`} aria-hidden />
            <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="-m-1 rounded p-1 opacity-70 hover:opacity-100"
              aria-label="Dismiss"
            >
              <span className="text-lg leading-none">&times;</span>
            </button>
          </div>
        )
      })}
    </div>
  )
}
