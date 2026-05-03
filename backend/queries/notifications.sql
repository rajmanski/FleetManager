-- name: CreateNotification :execlastid
INSERT INTO Notification (user_id, `type`, message, is_read)
VALUES (?, ?, ?, 0);

-- name: ListNotificationForUser :many
SELECT
  id,
  user_id,
  `type`,
  message,
  is_read,
  created_at
FROM Notification
WHERE user_id = ?
ORDER BY created_at DESC
LIMIT ?;

-- name: MarkNotificationReadForUser :execrows
UPDATE Notification
SET is_read = 1
WHERE id = ?
  AND user_id = ?;

