-- name: GetUserByLogin :one
SELECT
  u.user_id,
  u.username,
  r.role_name,
  u.password_hash,
  u.failed_login_attempts,
  u.locked_until
FROM Users u
JOIN Roles r ON r.role_id = u.role_id
WHERE u.username = ?
LIMIT 1;

-- name: UpdateUserLoginState :exec
UPDATE Users
SET failed_login_attempts = ?, locked_until = ?
WHERE user_id = ?;

-- name: UnlockUserAccount :execrows
UPDATE Users
SET failed_login_attempts = 0, locked_until = NULL
WHERE user_id = ?;
