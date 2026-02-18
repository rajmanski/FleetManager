export function extractApiError(error: unknown): string | null {
  if (!error) return null
  const maybe = error as { response?: { data?: { error?: string } } }
  return maybe.response?.data?.error ?? 'Operation failed.'
}
