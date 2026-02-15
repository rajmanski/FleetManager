import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateUserFormValues } from '@/schemas/users'
import {
  createUserSchema,
  type UpdateUserFormValues,
  updateUserSchema,
} from '@/schemas/users'
import { getStoredRole } from '@/services/authStorage'
import api from '@/services/api'

type AdminUser = {
  id: number
  login: string
  email: string
  role: string
  is_active: boolean
  created_at?: string
}

const formatRole = (role: string): string => {
  if (role === 'Spedytor') return 'Dispatcher'
  if (role === 'Mechanik') return 'Mechanic'
  return role
}

function UsersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (getStoredRole() !== 'Administrator') {
      navigate('/', { replace: true })
    }
  }, [navigate])
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null)

  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const res = await api.get<AdminUser[]>('/api/v1/admin/users')
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: CreateUserFormValues) => {
      const res = await api.post<AdminUser>('/api/v1/admin/users', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      setAddModalOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateUserFormValues }) => {
      const body: Record<string, unknown> = {
        login: data.login,
        email: data.email,
        role: data.role,
      }
      if (data.password.trim()) body.password = data.password
      const res = await api.put<AdminUser>(`/api/v1/admin/users/${id}`, body)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      setEditUser(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/v1/admin/users/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      setDeleteUser(null)
    },
  })

  const handleDeleteConfirm = () => {
    if (deleteUser) {
      deleteMutation.mutate(deleteUser.id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2>Users management</h2>
          <p className="text-gray-600">Create, edit and deactivate administrator panel users</p>
        </div>
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
        >
          Add user
        </button>
      </div>

      {usersQuery.isLoading && <p className="text-sm text-gray-500">Loading...</p>}
      {usersQuery.isError && (
        <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">
          Failed to load users. You may not have permission.
        </p>
      )}
      {usersQuery.isSuccess && usersQuery.data && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-700">Login</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Email</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Role</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {usersQuery.data.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3">{user.login}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">{formatRole(user.role)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setEditUser(user)}
                        className="mr-3 text-slate-700 transition-colors hover:text-slate-900"
                      >
                        Edit
                      </button>
                      {user.is_active ? (
                        <button
                          type="button"
                          onClick={() => setDeleteUser(user)}
                          className="text-red-600 transition-colors hover:text-red-800"
                        >
                          Delete
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Already inactive</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {addModalOpen && (
        <AddUserModal
          onClose={() => setAddModalOpen(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isSubmitting={createMutation.isPending}
          error={createMutation.error as { response?: { data?: { error?: string } } } | null}
        />
      )}

      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSubmit={(data) => updateMutation.mutate({ id: editUser.id, data })}
          isSubmitting={updateMutation.isPending}
          error={updateMutation.error as { response?: { data?: { error?: string } } } | null}
        />
      )}

      {deleteUser && (
        <DeleteConfirmModal
          user={deleteUser}
          onClose={() => setDeleteUser(null)}
          onConfirm={handleDeleteConfirm}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  )
}

type AddUserModalProps = {
  onClose: () => void
  onSubmit: (data: CreateUserFormValues) => void
  isSubmitting: boolean
  error: { response?: { data?: { error?: string } } } | null
}

function AddUserModal({ onClose, onSubmit, isSubmitting, error }: AddUserModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { login: '', password: '', email: '', role: 'Spedytor' },
  })

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold">Add user</h2>
        <form
          className="mt-4 space-y-4"
          onSubmit={handleSubmit((data) => onSubmit(data))}
        >
          <FormField label="Login" error={errors.login?.message}>
            <input
              type="text"
              {...register('login')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              autoComplete="username"
            />
          </FormField>
          <FormField label="Password" error={errors.password?.message}>
            <input
              type="password"
              {...register('password')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              autoComplete="new-password"
            />
          </FormField>
          <FormField label="Email" error={errors.email?.message}>
            <input
              type="email"
              {...register('email')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              autoComplete="email"
            />
          </FormField>
          <FormField label="Role" error={errors.role?.message}>
            <select {...register('role')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500">
              <option value="Administrator">Administrator</option>
              <option value="Spedytor">Dispatcher</option>
              <option value="Mechanik">Mechanic</option>
            </select>
          </FormField>
          {error?.response?.data?.error && (
            <p className="text-sm text-red-600">{error.response.data.error}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60">
              {isSubmitting ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

type EditUserModalProps = {
  user: AdminUser
  onClose: () => void
  onSubmit: (data: UpdateUserFormValues) => void
  isSubmitting: boolean
  error: { response?: { data?: { error?: string } } } | null
}

function EditUserModal({ user, onClose, onSubmit, isSubmitting, error }: EditUserModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      login: user.login,
      email: user.email,
      role: user.role as 'Administrator' | 'Spedytor' | 'Mechanik',
      password: '',
    },
  })

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold">Edit user</h2>
        <form
          className="mt-4 space-y-4"
          onSubmit={handleSubmit((data) => onSubmit(data))}
        >
          <FormField label="Login" error={errors.login?.message}>
            <input
              type="text"
              {...register('login')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              autoComplete="username"
            />
          </FormField>
          <FormField label="Password (leave empty to keep)" error={errors.password?.message}>
            <input
              type="password"
              {...register('password')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              placeholder="Leave empty to keep current"
              autoComplete="new-password"
            />
          </FormField>
          <FormField label="Email" error={errors.email?.message}>
            <input
              type="email"
              {...register('email')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              autoComplete="email"
            />
          </FormField>
          <FormField label="Role" error={errors.role?.message}>
            <select {...register('role')} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500">
              <option value="Administrator">Administrator</option>
              <option value="Spedytor">Dispatcher</option>
              <option value="Mechanik">Mechanic</option>
            </select>
          </FormField>
          {error?.response?.data?.error && (
            <p className="text-sm text-red-600">{error.response.data.error}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60">
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

type DeleteConfirmModalProps = {
  user: AdminUser
  onClose: () => void
  onConfirm: () => void
  isDeleting: boolean
}

function DeleteConfirmModal({
  user,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold">Delete user</h2>
        <p className="mt-2 text-sm text-gray-600">
          Are you sure you want to delete user <strong>{user.login}</strong>? This action cannot be
          undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

function FormField({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

export default UsersPage
