export function extractApiError(error: unknown, fallback?: string): string | null {
  if (!error) return null
  const e = error as {
    response?: { data?: { error?: string; message?: string } }
    message?: string
  }
  const msg =
    e.response?.data?.error ??
    e.response?.data?.message ??
    (e instanceof Error ? e.message : undefined)
  return msg ?? fallback ?? 'Operation failed.'
}
