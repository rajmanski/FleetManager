-- name: ListDrivers :many
SELECT
  driver_id,
  user_id,
  first_name,
  last_name,
  pesel,
  phone,
  email,
  status,
  deleted_at,
  created_at,
  updated_at
FROM Drivers
WHERE (? = 1 OR deleted_at IS NULL)
  AND (? = '' OR LOWER(first_name) LIKE CONCAT('%', LOWER(?), '%') OR LOWER(last_name) LIKE CONCAT('%', LOWER(?), '%'))
  AND (? = '' OR status = ?)
ORDER BY driver_id DESC
LIMIT ? OFFSET ?;

-- name: CountDrivers :one
SELECT COUNT(*)
FROM Drivers
WHERE (? = 1 OR deleted_at IS NULL)
  AND (? = '' OR LOWER(first_name) LIKE CONCAT('%', LOWER(?), '%') OR LOWER(last_name) LIKE CONCAT('%', LOWER(?), '%'))
  AND (? = '' OR status = ?);

-- name: GetDriverByID :one
SELECT
  driver_id,
  user_id,
  first_name,
  last_name,
  pesel,
  phone,
  email,
  status,
  created_at,
  updated_at
FROM Drivers
WHERE driver_id = ?
  AND deleted_at IS NULL
LIMIT 1;

-- name: CreateDriver :execlastid
INSERT INTO Drivers (
  user_id,
  first_name,
  last_name,
  pesel,
  phone,
  email,
  status
)
VALUES (?, ?, ?, ?, ?, ?, ?);

-- name: UpdateDriver :execrows
UPDATE Drivers
SET
  user_id = ?,
  first_name = ?,
  last_name = ?,
  pesel = ?,
  phone = ?,
  email = ?,
  status = ?,
  updated_at = NOW()
WHERE driver_id = ?
  AND deleted_at IS NULL;

-- name: HasActiveTripsByDriverID :one
SELECT EXISTS(
  SELECT 1
  FROM Trips
  WHERE driver_id = ?
    AND status IN ('Active', 'Scheduled')
);

-- name: SoftDeleteDriver :execrows
UPDATE Drivers
SET deleted_at = NOW(), updated_at = NOW()
WHERE driver_id = ?
  AND deleted_at IS NULL;

-- name: GetDeletedDriverPESELByID :one
SELECT pesel
FROM Drivers
WHERE driver_id = ?
  AND deleted_at IS NOT NULL
LIMIT 1;

-- name: HasActiveDriverWithPESELExcludingID :one
SELECT EXISTS(
  SELECT 1
  FROM Drivers
  WHERE pesel = ?
    AND deleted_at IS NULL
    AND driver_id <> ?
);

-- name: RestoreDriverByID :execrows
UPDATE Drivers
SET deleted_at = NULL, updated_at = NOW()
WHERE driver_id = ?
  AND deleted_at IS NOT NULL;

-- name: ListActiveDriverPESELs :many
SELECT driver_id, pesel
FROM Drivers
WHERE deleted_at IS NULL;

-- name: ListDriversForPESELSearch :many
SELECT
  driver_id,
  user_id,
  first_name,
  last_name,
  pesel,
  phone,
  email,
  status,
  deleted_at,
  created_at,
  updated_at
FROM Drivers
WHERE (? = 1 OR deleted_at IS NULL)
  AND (? = '' OR status = ?)
ORDER BY driver_id DESC
LIMIT 1000;

-- name: GetDriverTripOnDate :one
SELECT o.order_number
FROM Trips t
JOIN Orders o ON t.order_id = o.order_id
WHERE t.driver_id = sqlc.arg(driver_id)
  AND t.status IN ('Scheduled', 'Active')
  AND DATE(t.start_time) <= sqlc.arg(check_date)
  AND (t.end_time IS NULL OR DATE(t.end_time) >= sqlc.arg(check_date))
LIMIT 1;
