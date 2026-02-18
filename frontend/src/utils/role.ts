export function formatRole(role: string | null): string {
  if (!role) return 'Unknown role'
  if (role === 'Spedytor') return 'Dispatcher'
  if (role === 'Mechanik') return 'Mechanic'
  return role
}
