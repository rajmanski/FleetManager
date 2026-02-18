type LoadingMessageProps = {
  message?: string
}

export function LoadingMessage({ message = 'Loading...' }: LoadingMessageProps) {
  return <p className="text-sm text-gray-500">{message}</p>
}
