import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import api from '@/services/api'
import { getAccessToken, saveAccessToken } from '@/services/authStorage'
import { initAuthSessionManagement } from '@/services/api'

const loginSchema = z.object({
  login: z
    .string()
    .trim()
    .min(1, 'Login is required')
    .transform((v) => v.replace(/[<>]/g, '').toLowerCase()),
  password: z
    .string()
    .trim()
    .min(1, 'Password is required')
    .transform((v) => v.replace(/[<>]/g, '')),
})

type LoginFormValues = z.infer<typeof loginSchema>

type LoginResponse = {
  token: string
  user: {
    id: number
    login: string
    role: string
  }
}

function LoginPage() {
  const navigate = useNavigate()
  const [backendError, setBackendError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { login: '', password: '' },
  })

  useEffect(() => {
    if (getAccessToken()) {
      navigate('/', { replace: true })
    }
  }, [navigate])

  const onSubmit = async (data: LoginFormValues) => {
    setBackendError(null)
    try {
      const response = await api.post<LoginResponse>('/api/v1/auth/login', {
        login: data.login,
        password: data.password,
      })
      const token = response.data.token
      const tokenSaved = saveAccessToken(token)
      if (!tokenSaved) {
        setError('root', {
          message:
            'Session storage is unavailable in this browser. Please enable storage and try again.',
        })
        return
      }

      initAuthSessionManagement()
      navigate('/', { replace: true })
    } catch (error) {
      const axiosError = error as {
        response?: { data?: { error?: string } }
      }
      const message = axiosError.response?.data?.error ?? 'Login failed. Please try again.'
      setBackendError(message)
    }
  }

  const displayError = backendError ?? errors.root?.message

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto mt-20 max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Sign in</h1>
        <p className="mt-1 text-sm text-gray-600">Fleet Manager access panel</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit((data) => void onSubmit(data))}>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="login">
              Login
            </label>
            <input
              id="login"
              type="text"
              autoComplete="username"
              {...register('login')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {errors.login && (
              <p className="mt-1 text-sm text-red-600">{errors.login.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {displayError && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {displayError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
