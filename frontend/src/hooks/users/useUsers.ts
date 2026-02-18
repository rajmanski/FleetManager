import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateUserFormValues } from '@/schemas/users'
import type { UpdateUserFormValues } from '@/schemas/users'
import api from '@/services/api'

export type AdminUser = {
  id: number
  login: string
  email: string
  role: string
  is_active: boolean
  created_at?: string
}

export function useUsers() {
  const queryClient = useQueryClient()

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
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/v1/admin/users/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })

  return {
    usersQuery,
    createMutation,
    updateMutation,
    deleteMutation,
  }
}
