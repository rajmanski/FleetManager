import { User, Mail, ShieldCheck, CircleDot, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ThWithIcon } from '@/components/ui/ThWithIcon'
import type { AdminUser } from '@/hooks/users/useUsers'
import { formatRole } from '@/utils/role'

type UsersTableProps = {
  users: AdminUser[]
  onEdit: (user: AdminUser) => void
  onDelete: (user: AdminUser) => void
}

export function UsersTable({ users, onEdit, onDelete }: UsersTableProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm table-sticky-last-col">
          <thead className="bg-gray-50">
            <tr>
            <ThWithIcon icon={User}>Login</ThWithIcon>
                <ThWithIcon icon={Mail}>Email</ThWithIcon>
                <ThWithIcon icon={ShieldCheck}>Role</ThWithIcon>
                <ThWithIcon icon={CircleDot}>Status</ThWithIcon>
                <ThWithIcon icon={Wrench}>Actions</ThWithIcon>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.map((user) => (
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
                  <Button
                    variant="ghost"
                    onClick={() => onEdit(user)}
                    className="mr-3"
                  >
                    Edit
                  </Button>
                  {user.is_active ? (
                    <Button variant="danger-ghost" onClick={() => onDelete(user)}>
                      Delete
                    </Button>
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
  )
}
