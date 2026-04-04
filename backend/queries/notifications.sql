-- name: CreateNotification :execlastid
INSERT INTO notifications (user_id, `type`, message, is_read)
VALUES (?, ?, ?, 0);

-- name: ListNotificationsForUser :many
SELECT
  id,
  user_id,
  `type`,
  message,
  is_read,
  created_at
FROM notifications
WHERE user_id = ?
ORDER BY created_at DESC
LIMIT ?;

-- name: MarkNotificationReadForUser :execrows
UPDATE notifications
SET is_read = 1
WHERE id = ?
  AND user_id = ?;

