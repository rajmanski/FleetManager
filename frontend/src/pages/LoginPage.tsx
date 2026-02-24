import { Truck } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { FormField } from '@/components/ui/FormField'
import { INPUT_CLASS } from '@/constants/inputStyles'
import { getAccessToken } from '@/services/authStorage'
import { loginSchema, type LoginFormValues } from '@/schemas/auth'
import { useLogin } from '@/hooks/useLogin'
import { useToast } from '@/context/ToastContext'

function LoginPage() {
  const toast = useToast()
  const navigate = useNavigate()
  const { login, isSubmitting } = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
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
    const result = await login(data)
    if (result.success) {
      toast.success('Signed in successfully')
    } else {
      setError('root', { message: result.error })
      toast.error(result.error)
    }
  }

  const displayError = errors.root?.message

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
              <FormField label="Login" error={errors.login?.message} required>
                <input
                  id="login"
                  type="text"
                  autoComplete="username"
                  {...register('login')}
                  className={INPUT_CLASS}
                />
              </FormField>

              <FormField label="Password" error={errors.password?.message} required>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register('password')}
                  className={INPUT_CLASS}
                />
              </FormField>

              {displayError && (
                <ErrorMessage message={displayError} variant="soft" />
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
