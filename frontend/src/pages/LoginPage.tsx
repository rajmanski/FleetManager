import { Truck } from 'lucide-react'
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
      <div className="mx-auto mt-16 max-w-4xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="bg-slate-700 p-8 text-white">
            <div className="mb-6 inline-flex rounded-lg bg-white/15 p-3">
              <Truck className="size-8" />
            </div>
            <h1 className="text-3xl font-semibold">FleetManager Pro</h1>
            <p className="mt-2 text-sm text-slate-200">
              Secure access for dispatchers, mechanics and administrators.
            </p>
            <div className="mt-8 rounded-lg border border-white/20 bg-white/10 p-4 text-sm">
              Sign in to manage fleet operations in one place.
            </div>
          </div>

          <div className="p-8">
            <h2 className="text-2xl font-semibold text-gray-900">Sign in</h2>
            <p className="mt-1 text-sm text-gray-600">Fleet Manager access panel</p>

            <form
              className="mt-6 space-y-4"
              onSubmit={handleSubmit((data) => void onSubmit(data))}
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="login">
                  Login
                </label>
                <input
                  id="login"
                  type="text"
                  autoComplete="username"
                  {...register('login')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
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
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
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
                className="w-full rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
