type FormErrorMessageProps = {
  message: string | null
}

export function FormErrorMessage({ message }: FormErrorMessageProps) {
  if (!message) return null
  return <p className="mt-1 text-sm text-red-600">{message}</p>
}
