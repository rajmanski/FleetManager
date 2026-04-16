-- name: ListChangelog :many
SELECT
  c.id,
  c.user_id,
  u.username,
  c.table_name,
  c.record_id,
  c.operation,
  c.old_data,
  c.new_data,
  c.`timestamp`
FROM Changelog c
LEFT JOIN Users u ON c.user_id = u.user_id
WHERE (? = 0 OR c.user_id = ?)
  AND (? = 0 OR c.record_id = ?)
  AND (? = '' OR c.table_name = ?)
  AND (? = '' OR c.operation = ?)
  AND (? = 0 OR c.`timestamp` >= ?)
  AND (? = 0 OR c.`timestamp` <= ?)
ORDER BY c.`timestamp` DESC
LIMIT ? OFFSET ?;

-- name: CountChangelog :one
SELECT COUNT(*)
FROM Changelog
WHERE (? = 0 OR user_id = ?)
  AND (? = 0 OR record_id = ?)
  AND (? = '' OR table_name = ?)
  AND (? = '' OR operation = ?)
  AND (? = 0 OR `timestamp` >= ?)
  AND (? = 0 OR `timestamp` <= ?);

-- name: AnonymizeDriverChangelog :execrows
UPDATE Changelog
SET
  old_data = CASE
    WHEN old_data IS NULL THEN NULL
    ELSE JSON_SET(
      old_data,
      '$.user_id', NULL,
      '$.first_name', 'Anonimowy',
      '$.last_name', 'Anonimowy',
      '$.pesel', NULL,
      '$.phone', NULL,
      '$.email', NULL,
      '$.license_number', NULL,
      '$.license_expiry_date', NULL,
      '$.adr_certified', 0,
      '$.adr_expiry_date', NULL
    )
  END,
  new_data = CASE
    WHEN new_data IS NULL THEN NULL
    ELSE JSON_SET(
      new_data,
      '$.user_id', NULL,
      '$.first_name', 'Anonimowy',
      '$.last_name', 'Anonimowy',
      '$.pesel', NULL,
      '$.phone', NULL,
      '$.email', NULL,
      '$.license_number', NULL,
      '$.license_expiry_date', NULL,
      '$.adr_certified', 0,
      '$.adr_expiry_date', NULL
    )
  END
WHERE table_name = 'drivers'
  AND record_id = ?;
