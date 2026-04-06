type NotificationStatusBadgeProps = {
  unread: boolean
  variant: 'bell' | 'table'
}

export function NotificationStatusBadge({ unread, variant }: NotificationStatusBadgeProps) {
  if (variant === 'bell') {
    return unread ? (
      <span
        className="size-2 shrink-0 rounded-full bg-blue-600"
        title="Unread"
        aria-label="Unread"
      />
    ) : (
      <span className="text-[10px] text-gray-400">Read</span>
    )
  }

  return unread ? (
    <span className="text-xs font-medium text-blue-700">Unread</span>
  ) : (
    <span className="text-xs text-gray-500">Read</span>
  )
}
