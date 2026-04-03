-- name: CreateNotification :execlastid
INSERT INTO notifications (user_id, `type`, message, is_read)
VALUES (?, ?, ?, 0);

