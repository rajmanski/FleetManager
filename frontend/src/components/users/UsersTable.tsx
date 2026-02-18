import { Button } from '@/components/ui/Button'
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
