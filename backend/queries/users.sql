-- name: ListAdminUsers :many
SELECT
  u.user_id,
  u.username,
  u.email,
  r.role_name,
  u.is_active,
  u.created_at
FROM Users u
JOIN Roles r ON r.role_id = u.role_id
ORDER BY u.user_id ASC;

-- name: GetAdminUserByID :one
SELECT
  u.user_id,
  u.username,
  u.email,
  r.role_name,
  u.is_active,
  u.created_at
FROM Users u
JOIN Roles r ON r.role_id = u.role_id
WHERE u.user_id = ?
LIMIT 1;

-- name: GetRoleIDByName :one
SELECT role_id
FROM Roles
WHERE role_name = ?
LIMIT 1;

-- name: CreateAdminUser :execlastid
INSERT INTO Users (
  role_id,
  username,
  password_hash,
  email,
  is_active,
  failed_login_attempts,
  locked_until
)
VALUES (?, ?, ?, ?, 1, 0, NULL);

-- name: UpdateAdminUser :execrows
UPDATE Users
SET role_id = ?, username = ?, email = ?
WHERE user_id = ?;

-- name: SoftDeleteAdminUser :execrows
UPDATE Users
SET is_active = 0
WHERE user_id = ?;
