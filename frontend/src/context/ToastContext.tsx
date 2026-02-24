import { createContext, useCallback, useContext, useState } from 'react'
import { ToastContainer } from '@/components/ui/ToastContainer'

type ToastType = 'success' | 'error'

type Toast = {
  id: number
  type: ToastType
  message: string
}

type ToastContextValue = {
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let nextId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const success = useCallback((message: string) => {
    const id = nextId++
    setToasts((prev) => [...prev.slice(-4), { id, type: 'success', message }])
    setTimeout(() => removeToast(id), 5000)
  }, [removeToast])

  const error = useCallback((message: string) => {
    const id = nextId++
    setToasts((prev) => [...prev.slice(-4), { id, type: 'error', message }])
    setTimeout(() => removeToast(id), 6000)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ success, error }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}
