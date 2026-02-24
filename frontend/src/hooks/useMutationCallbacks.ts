import { useCallback } from 'react'
import { useToast } from '@/context/ToastContext'
import { extractApiError } from '@/utils/api'

type MutationCallbacksOptions = {
  successMessage: string
  errorFallback: string
  onSuccess?: () => void
}

export function useMutationCallbacks({
  successMessage,
  errorFallback,
  onSuccess,
}: MutationCallbacksOptions) {
  const toast = useToast()

  const handleSuccess = useCallback(() => {
    onSuccess?.()
    toast.success(successMessage)
  }, [toast, successMessage, onSuccess])

  const handleError = useCallback(
    (err: unknown) => {
      toast.error(extractApiError(err, errorFallback) ?? errorFallback)
    },
    [toast, errorFallback]
  )

  return { onSuccess: handleSuccess, onError: handleError }
}
