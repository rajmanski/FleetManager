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
