import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '@/services/api'
import { initAuthSessionManagement } from '@/services/api'
import { saveAccessToken } from '@/services/authStorage'
import { extractApiError } from '@/utils/api'
import type { LoginFormValues } from '@/schemas/auth'

type LoginResponse = {
  token: string
  user: {
    id: number
    login: string
    role: string
  }
}

export type LoginResult =
  | { success: true }
  | { success: false; error: string }

export function useLogin() {
  const navigate = useNavigate()

  const mutation = useMutation<LoginResult, unknown, LoginFormValues>({
    mutationFn: async (data) => {
      try {
        const response = await api.post<LoginResponse>('/api/v1/auth/login', {
          login: data.login,
          password: data.password,
        })
        const token = response.data.token
        const tokenSaved = saveAccessToken(token)
        if (!tokenSaved) {
          return {
            success: false,
            error:
              'Session storage is unavailable in this browser. Please enable storage and try again.',
          }
        }
        initAuthSessionManagement()
        return { success: true }
      } catch (error) {
        return { success: false, error: extractApiError(error) ?? 'Login failed.' }
      }
    },
  })

  const login = async (data: LoginFormValues): Promise<LoginResult> => {
    const result = await mutation.mutateAsync(data)
    if (result.success) {
      navigate('/', { replace: true })
    }
    return result
  }

  return {
    login,
    isSubmitting: mutation.isPending,
  }
}
